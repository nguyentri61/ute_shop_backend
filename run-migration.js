const { execSync } = require('child_process');

try {
  console.log('Running Prisma migration...');
  execSync('npx prisma migrate dev --name add_favorites_and_recently_viewed', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
