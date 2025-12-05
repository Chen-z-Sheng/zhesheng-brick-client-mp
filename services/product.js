const request = require('../utils/request');

const fetchProducts = () => request.get('/products');

const searchProducts = (keyword = '') => request.get('/products/search', { keyword });

module.exports = {
  fetchProducts,
  searchProducts,
};


