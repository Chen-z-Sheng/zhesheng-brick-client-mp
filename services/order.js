const request = require('../utils/request');

const submitOrder = (payload) => request.post('/orders', payload, { showLoading: true });

module.exports = {
  submitOrder,
};


