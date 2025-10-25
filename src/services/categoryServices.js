// src/services/categoryServices.js
import * as categoryRepo from "../repositories/categoryRepository.js";

export const listCategories = async ({ page = 1, size = 10, q = "" } = {}) => {
    const skip = (page - 1) * size;
    const take = size;
    return categoryRepo.findCategories({ skip, take, q });
};

export const getAllCategories = async () => {
    return categoryRepo.findAllCategories();
};

export const getCategoryById = async (id) => {
    return categoryRepo.findCategoryById(id);
};

export const createCategory = async ({ name, icon }) => {
    // Optional: check duplicate name
    const existing = await categoryRepo.findCategories({ q: name, skip: 0, take: 1 });
    if (existing.total > 0 && existing.items.find(i => i.name.toLowerCase() === name.toLowerCase())) {
        const err = new Error("Category name already exists");
        err.code = "DUPLICATE_NAME";
        throw err;
    }
    return categoryRepo.createCategory({ name, icon });
};

export const updateCategory = async (id, payload) => {
    // You might add checks (e.g., ensure exists)
    return categoryRepo.updateCategory(id, payload);
};

export const removeCategory = async (id) => {
    return categoryRepo.deleteCategory(id);
};
