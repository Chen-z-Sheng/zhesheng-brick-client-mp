const request = require('../utils/request');

const submitOrder = (payload) => request.post('/orders', payload, { showLoading: true });

const saveFormSubmission = (payload) => {
  return request
    .post('/api/client/form-submissions', payload)
    .then((res) => res?.data || res);
};

module.exports = {
  submitOrder,
  saveFormSubmission
};


