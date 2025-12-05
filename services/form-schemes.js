const request = require('../utils/request');

// 获取方案列表（原有）
const fetchPlans = () => request.get('/api/admin/form-schemes');

// 搜索方案（原有，注意接口路径需和后端对齐）
const searchPlans = (keyword = '') => request.get('/api/admin/form-schemes/search', { keyword });

// 新增：根据模板ID获取表单模板
const fetchFormTemplate = (templateId) => request.get(`/api/admin/form-templates/${templateId}`);

module.exports = {
  fetchPlans,
  searchPlans,
  fetchFormTemplate,
};