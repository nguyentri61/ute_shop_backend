// services/dashboardService.js
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

function calcPercent(current, last) {
    if (last === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - last) / last) * 100);
}

// --- Tháng VN (UTC+7) -> UTC ---
function vnMonthBoundaries(date = new Date()) {
    const t = new Date(date.getTime() + 7 * 3600 * 1000); // shift sang VN
    const thisStartLocal = new Date(t.getFullYear(), t.getMonth(), 1, 0, 0, 0, 0);
    const lastStartLocal = new Date(t.getFullYear(), t.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastEndLocal = new Date(t.getFullYear(), t.getMonth(), 1, 0, 0, 0, 0); // exclusive

    const thisStartUTC = new Date(thisStartLocal.getTime() - 7 * 3600 * 1000);
    const lastStartUTC = new Date(lastStartLocal.getTime() - 7 * 3600 * 1000);
    const lastEndUTC = new Date(lastEndLocal.getTime() - 7 * 3600 * 1000);
    return { thisStartUTC, lastStartUTC, lastEndUTC };
}

// --- Tuần hiện tại VN (T2..CN) ---
function getVNWeekRange() {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const wd = vnNow.getDay(); // 0..6 (CN..T7)
    const diffToMon = (wd + 6) % 7;

    const startLocal = new Date(vnNow);
    startLocal.setHours(0, 0, 0, 0);
    startLocal.setDate(startLocal.getDate() - diffToMon);

    const endLocal = new Date(startLocal);
    endLocal.setDate(endLocal.getDate() + 7); // exclusive

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startLocal);
        d.setDate(startLocal.getDate() + i);
        return d;
    });

    const startUtc = new Date(startLocal.getTime() - 7 * 3600 * 1000);
    const endUtc = new Date(endLocal.getTime() - 7 * 3600 * 1000);
    return { startUtc, endUtc, days };
}

function labelVN(d) {
    const w = d.getDay(); // 0 CN..6 T7
    return w === 0 ? "CN" : `T${w + 1}`;
}
function ymd(d) {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 10);
}

// --- Khoảng thời gian VN theo query ---
function getVNRangeByQuery({ start, end, range } = {}) {
    const toVN = (d) => new Date(new Date(d).getTime() + 7 * 3600 * 1000);
    const fromVNtoUTC = (d) => new Date(d.getTime() - 7 * 3600 * 1000);

    let startLocal, endLocal;

    if (start && end) {
        // start/end là 'YYYY-MM-DD' hoặc ISO
        startLocal = toVN(start);
        startLocal.setHours(0, 0, 0, 0);

        endLocal = toVN(end);
        endLocal.setHours(0, 0, 0, 0);
        endLocal.setDate(endLocal.getDate() + 1); // exclusive
    } else {
        // range: '7d' | '30d' | '90d' | 'month'
        const nowVN = toVN(new Date());
        nowVN.setHours(0, 0, 0, 0);

        if (range === 'month') {
            startLocal = new Date(nowVN.getFullYear(), nowVN.getMonth(), 1, 0, 0, 0, 0);
            endLocal = new Date(nowVN.getFullYear(), nowVN.getMonth() + 1, 1, 0, 0, 0, 0);
            return { startUtc: fromVNtoUTC(startLocal), endUtc: fromVNtoUTC(endLocal) };
        }

        let days = 30;
        if (range === '7d') days = 7;
        if (range === '90d') days = 90;

        startLocal = new Date(nowVN);
        startLocal.setDate(nowVN.getDate() - (days - 1)); // tính cả hôm nay
        endLocal = new Date(nowVN);
        endLocal.setDate(nowVN.getDate() + 1); // exclusive
    }

    return { startUtc: fromVNtoUTC(startLocal), endUtc: fromVNtoUTC(endLocal) };
}

// ===================== CATEGORY SHARE =====================
export async function getCategoryShareService({ statuses, status, start, end, range } = {}) {
    // Hỗ trợ status (string CSV) hoặc statuses (array). Không có -> bỏ lọc.
    let statusList = [];
    if (Array.isArray(statuses) && statuses.length) {
        statusList = statuses;
    } else if (typeof status === "string" && status.trim()) {
        statusList = status.split(",").map(s => s.trim()).filter(Boolean);
    }
    const hasStatusFilter = statusList.length > 0;

    const { startUtc, endUtc } = getVNRangeByQuery({ start, end, range });

    const baseSql = Prisma.sql`
    SELECT
      c.id   AS categoryId,
      c.name AS name,
      SUM(oi.price * oi.quantity) AS revenue,
      SUM(oi.quantity)            AS units
    FROM orderItem oi
    JOIN \`order\` o        ON o.id = oi.order_id
    JOIN productVariant v   ON v.id = oi.variantId
    JOIN product p          ON p.id = v.productId
    JOIN category c         ON c.id = p.categoryId
    WHERE o.createdAt >= ${startUtc}
      AND o.createdAt <  ${endUtc}
  `;

    const statusSql = hasStatusFilter
        ? Prisma.sql` AND o.status IN (${Prisma.join(statusList)}) `
        : Prisma.sql``;

    const tailSql = Prisma.sql`
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `;

    const rows = await prisma.$queryRaw(Prisma.sql`${baseSql} ${statusSql} ${tailSql}`);

    return rows.map(r => ({
        categoryId: r.categoryId,
        name: r.name,
        value: Number(r.revenue ?? 0),
        units: Number(r.units ?? 0),
    }));
}

// ===================== DASHBOARD STATS =====================
export const getDashboardStatsService = async () => {
    const { thisStartUTC, lastStartUTC, lastEndUTC } = vnMonthBoundaries();

    const [
        totalOrders, lastMonthOrders, thisMonthOrders,
        totalProducts, lastMonthProducts, thisMonthProducts,
        totalUsers, lastMonthUsers, thisMonthUsers,
        totalRevenueAgg, lastMonthRevenueAgg, thisMonthRevenueAgg
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: lastStartUTC, lt: lastEndUTC } } }),
        prisma.order.count({ where: { createdAt: { gte: thisStartUTC } } }),

        prisma.product.count(),
        prisma.product.count({ where: { createdAt: { gte: lastStartUTC, lt: lastEndUTC } } }),
        prisma.product.count({ where: { createdAt: { gte: thisStartUTC } } }),

        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: lastStartUTC, lt: lastEndUTC } } }),
        prisma.user.count({ where: { createdAt: { gte: thisStartUTC } } }),

        // Revenue: chỉ đơn DELIVERED
        prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: lastStartUTC, lt: lastEndUTC } } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: thisStartUTC } } }),
    ]);

    const totalRevenue = Number(totalRevenueAgg._sum.total ?? 0);
    const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.total ?? 0);
    const thisMonthRevenue = Number(thisMonthRevenueAgg._sum.total ?? 0);

    return {
        orders: {
            total: totalOrders,
            thisMonth: thisMonthOrders,
            lastMonth: lastMonthOrders,
            percent: calcPercent(thisMonthOrders, lastMonthOrders),
        },
        products: {
            total: totalProducts,
            thisMonth: thisMonthProducts,
            lastMonth: lastMonthProducts,
            percent: calcPercent(thisMonthProducts, lastMonthProducts),
        },
        users: {
            total: totalUsers,
            thisMonth: thisMonthUsers,
            lastMonth: lastMonthUsers,
            percent: calcPercent(thisMonthUsers, lastMonthUsers),
        },
        revenue: {
            total: totalRevenue,
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            percent: calcPercent(thisMonthRevenue, lastMonthRevenue),
        },
    };
};

// ===================== WEEKLY REVENUE =====================
export async function getWeeklyRevenueService(status = "DELIVERED") {
    const { startUtc, endUtc, days } = getVNWeekRange();
    const TZ_OFFSET = "+07:00";

    // SUBQUERY để tránh ONLY_FULL_GROUP_BY
    const rows = await prisma.$queryRaw`
    SELECT
      t.d AS d,
      SUM(t.total) AS sales,
      COUNT(*) AS orders
    FROM (
      SELECT
        DATE(CONVERT_TZ(o.createdAt, '+00:00', ${TZ_OFFSET})) AS d,
        o.total AS total
      FROM \`order\` o
      WHERE o.status = ${status}
        AND o.createdAt >= ${startUtc}
        AND o.createdAt <  ${endUtc}
    ) AS t
    GROUP BY t.d
    ORDER BY t.d;
  `;

    const map = new Map();
    rows.forEach(r => {
        const key = ymd(new Date(r.d));
        map.set(key, { sales: Number(r.sales ?? 0), orders: Number(r.orders ?? 0) });
    });

    return days.map(d => {
        const key = ymd(d);
        const hit = map.get(key) ?? { sales: 0, orders: 0 };
        return { name: labelVN(d), sales: hit.sales, orders: hit.orders, date: key };
    });
}
