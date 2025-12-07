const request = require('../utils/request');

// 获取方案列表
const fetchPlans = (keyword = '') => {
  const params = {};

  const kw = (keyword || '').trim();
  if (kw) {
    params.keyword = kw;
  }

  return request
    .get('/api/client/form-schemes', params)
    .then((res) => {
      const data = res?.data || res;
      return data || [];
    });
};

// 获取模板
const fetchFormTemplate = (templateId) => {
  return request
    .get(`/api/client/form-template/${templateId}`)
    .then((res) => {
      const data = res?.data || res;
      return data;
    });
};

// 添加填写记录

module.exports = {
  fetchPlans,
  fetchFormTemplate
};