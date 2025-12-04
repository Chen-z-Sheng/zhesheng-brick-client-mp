Page({
  data: {
    needScroll: false,
    contact: 'czs666888fff',
    
  },

  onLoad() {
    // 移除可能导致错误的aPage相关代码
    this.checkAnnouncementScroll();
  },

  /**
   * 检查公告是否需要滚动
   */
  checkAnnouncementScroll() {
    const query = wx.createSelectorQuery();
    query.select('.announcement-text').boundingClientRect();
    query.select('.announcement-wrapper').boundingClientRect();
    query.exec((res) => {
      if (res && res[0] && res[1]) {
        this.setData({
          needScroll: res[0].width > res[1].width
        });
      }
    });
  },

  /**
   * 公告栏点击事件
   */
  onAnnouncementTap() {
    wx.showModal({
      title: '公告详情',
      content: '欢迎使用物品收纳箱服务！\n\n最新公告：服务升级，效率提升！更多优惠活动即将上线，敬请期待...\n新用户注册即送20元优惠券，有效期30天。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 点击复制联系方式
   */
  copyContact(e) {
    const contact = e?.currentTarget?.dataset?.contact || this.data.contact || '';
    if (!contact) {
      wx.showToast({ title: '联系方式缺失', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: contact,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  }
})