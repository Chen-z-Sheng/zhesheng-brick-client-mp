const { login } = require('../../services/auth');

Page({
  data: {
    phone: '',
    code: '',
  },

  onInputPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  onInputCode(e) {
    this.setData({ code: e.detail.value });
  },

  async handleLogin() {
    const { phone, code } = this.data;
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!code) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '登录中...' });
      await login({ phone, code });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.showToast({ title: err?.message || '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
});


