const TOKEN_KEY = 'token';

const getToken = () => wx.getStorageSync(TOKEN_KEY) || '';

const setToken = (token = '') => {
  wx.setStorageSync(TOKEN_KEY, token);
};

const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
};

module.exports = {
  TOKEN_KEY,
  getToken,
  setToken,
  clearToken,
};


