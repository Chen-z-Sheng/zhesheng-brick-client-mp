const request = require('../utils/request');
const { setToken, clearToken } = require('../utils/storage');

// 示例：登录，需根据后端实际字段调整
const login = async (payload) => {
  const data = await request.post('/auth/login', payload, { showLoading: true });
  if (data && data.token) {
    setToken(data.token);
  }
  return data;
};

const logout = () => {
  clearToken();
  // 如需通知后端，可调用 /auth/logout
};

module.exports = {
  login,
  logout,
};


