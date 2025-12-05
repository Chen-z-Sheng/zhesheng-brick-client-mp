const { BASE_URL, TIMEOUT = 15000 } = require('../config/index');
const { getToken, clearToken } = require('./storage');

/**
 * 统一请求封装：自动拼接 BASE_URL、携带 token、处理错误码
 */
const request = ({
  url,
  method = 'GET',
  data = {},
  header = {},
  showLoading = false,
}) => new Promise((resolve, reject) => {
  const token = getToken();

  if (showLoading) {
    wx.showNavigationBarLoading();
  }

  wx.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    timeout: TIMEOUT,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...header,
    },
    success: (res) => {
      const { statusCode, data: respData } = res;

      if (statusCode === 401) {
        clearToken();
        wx.showToast({ title: '请先登录', icon: 'none' });
        // 约定：跳转到登录页（需自行实现）
        wx.navigateTo({ url: '/pages/login/login' });
        return reject(respData || {});
      }

      if (statusCode >= 200 && statusCode < 300) {
        // 后端常见返回结构：{ code: 0, data, message }
        if (respData && typeof respData.code !== 'undefined' && respData.code !== 0) {
          wx.showToast({ title: respData.message || '请求失败', icon: 'none' });
          return reject(respData);
        }
        const payload = (respData && typeof respData.data !== 'undefined')
          ? respData.data
          : respData;
        return resolve(payload);
      }

      wx.showToast({ title: respData?.message || '请求失败', icon: 'none' });
      return reject(respData);
    },
    fail: (err) => {
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      reject(err);
    },
    complete: () => {
      if (showLoading) {
        wx.hideNavigationBarLoading();
      }
      if (wx.stopPullDownRefresh) {
        wx.stopPullDownRefresh();
      }
    },
  });
});

const get = (url, params = {}, options = {}) => request({
  url,
  method: 'GET',
  data: params,
  ...options,
});

const post = (url, body = {}, options = {}) => request({
  url,
  method: 'POST',
  data: body,
  ...options,
});

module.exports = {
  request,
  get,
  post,
};


