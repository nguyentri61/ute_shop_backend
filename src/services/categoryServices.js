const categoryRepository = require('../repositories/categoryRepository');

async function getAllCategories() {
    return categoryRepository.findAllCategories();
}

module.exports = {
    getAllCategories
};