// page/submit-form/submit-form.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    formType: '', // 'market' 或 'normal'
    planIndex: 0,
    planList: [], // 方案列表
    filteredPlanList: [], // 过滤后的方案列表
    planSearchText: '', // 方案搜索文本
    showPlanDropdown: false, // 是否显示方案下拉框
    planInputFocus: false, // 方案输入框是否获取焦点
    isLoadingPlans: false, // 是否正在加载方案
    currentPlan: null, // 当前选中的方案
    formData: {
      address: '',
      orderNumber: '',
      expressNumber: '',
      orderImage: '',
      quantity: '',
      expectedReturn: '0.00',
      remark: ''
    },
    productList: [], // 商品列表
    filteredProductList: [], // 过滤后的商品列表
    productSearchText: '', // 商品搜索文本
    showProductDropdown: false, // 是否显示商品下拉框
    productInputFocus: false, // 商品输入框是否获取焦点
    isLoadingProducts: false, // 是否正在加载商品
    selectedProducts: [], // 已选商品列表
    expectedReturn: '0.00', // 预计回款金额
    searchTimer: null // 用于延时搜索的定时器
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { type } = options;
    this.setData({
      formType: type || 'normal'
    });
    
    if (type === 'market') {
      this.getProductList();
    } else {
      this.getPlanList();
    }
  },

  /**
   * 获取方案列表
   */
  getPlanList() {
    this.setData({ isLoadingPlans: true });
    
    // TODO: 调用后端接口获取方案列表
    wx.request({
      url: 'https://api.example.com/plans',
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            planList: res.data.list || [],
            filteredPlanList: res.data.list || [],
            currentPlan: res.data.list[0] || null,
            isLoadingPlans: false
          });
        } else {
          wx.showToast({ title: res.data.message || '获取方案失败', icon: 'none' });
          this.setData({ isLoadingPlans: false });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        this.setData({ isLoadingPlans: false });
      }
    });
  },

  /**
   * 获取商品列表
   */
  getProductList() {
    this.setData({ isLoadingProducts: true });
    
    // TODO: 调用后端接口获取商品列表
    wx.request({
      url: 'https://api.example.com/products',
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            productList: res.data.list || [],
            filteredProductList: res.data.list || [],
            isLoadingProducts: false
          });
        } else {
          wx.showToast({ title: res.data.message || '获取商品失败', icon: 'none' });
          this.setData({ isLoadingProducts: false });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        this.setData({ isLoadingProducts: false });
      }
    });
  },

  /**
   * 聚焦方案输入框
   */
  focusPlanInput() {
    this.setData({
      planInputFocus: true,
      showPlanDropdown: true
    });
  },

  /**
   * 聚焦商品输入框
   */
  focusProductInput() {
    this.setData({
      productInputFocus: true,
      showProductDropdown: true
    });
  },

  /**
   * 执行方案搜索
   */
  searchPlans(searchText) {
    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
    
    if (!searchText) {
      this.setData({
        filteredPlanList: this.data.planList
      });
      return;
    }
    
    // 设置新的定时器，500ms后执行搜索（防抖处理）
    const timer = setTimeout(() => {
      this.setData({ isLoadingPlans: true });
      
      // TODO: 调用后端接口搜索方案
      wx.request({
        url: 'https://api.example.com/plans/search',
        method: 'GET',
        data: { keyword: searchText },
        success: (res) => {
          if (res.data.code === 0) {
            this.setData({
              filteredPlanList: res.data.list || [],
              isLoadingPlans: false
            });
          } else {
            wx.showToast({ title: res.data.message || '搜索失败', icon: 'none' });
            this.setData({ isLoadingPlans: false });
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          this.setData({ isLoadingPlans: false });
        }
      });
    }, 500);
    
    this.setData({ searchTimer: timer });
  },

  /**
   * 执行商品搜索
   */
  searchProducts(searchText) {
    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
    
    if (!searchText) {
      this.setData({
        filteredProductList: this.data.productList
      });
      return;
    }
    
    // 设置新的定时器，500ms后执行搜索（防抖处理）
    const timer = setTimeout(() => {
      this.setData({ isLoadingProducts: true });
      
      // TODO: 调用后端接口搜索商品
      wx.request({
        url: 'https://api.example.com/products/search',
        method: 'GET',
        data: { keyword: searchText },
        success: (res) => {
          if (res.data.code === 0) {
            this.setData({
              filteredProductList: res.data.list || [],
              isLoadingProducts: false
            });
          } else {
            wx.showToast({ title: res.data.message || '搜索失败', icon: 'none' });
            this.setData({ isLoadingProducts: false });
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          this.setData({ isLoadingProducts: false });
        }
      });
    }, 500);
    
    this.setData({ searchTimer: timer });
  },

  /**
   * 切换方案下拉框显示状态
   */
  togglePlanDropdown() {
    this.setData({
      showPlanDropdown: !this.data.showPlanDropdown,
      showProductDropdown: false
    });
  },

  /**
   * 切换商品下拉框显示状态
   */
  toggleProductDropdown() {
    this.setData({
      showProductDropdown: !this.data.showProductDropdown,
      showPlanDropdown: false
    });
  },

  /**
   * 选择方案
   */
  selectPlan(e) {
    const index = e.currentTarget.dataset.index;
    const plan = this.data.filteredPlanList[index];
    const planIndex = this.data.planList.findIndex(item => item.id === plan.id);
    
    this.setData({
      planIndex: planIndex,
      currentPlan: plan,
      showPlanDropdown: false,
      formData: {
        address: plan.address || '',
        orderNumber: '',
        expressNumber: '',
        orderImage: '',
        quantity: '',
        expectedReturn: '0.00',
        remark: ''
      }
    });
  },

  /**
   * 切换商品选择状态
   */
  toggleProductSelection(e) {
    const id = e.currentTarget.dataset.id;
    const productList = this.data.productList;
    const index = productList.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const selected = !productList[index].selected;
      
      this.setData({
        [`productList[${index}].selected`]: selected
      });
      
      const filteredIndex = this.data.filteredProductList.findIndex(item => item.id === id);
      if (filteredIndex !== -1) {
        this.setData({
          [`filteredProductList[${filteredIndex}].selected`]: selected
        });
      }
      
      if (selected) {
        this.setData({
          selectedProducts: [...this.data.selectedProducts, {
            ...productList[index],
            quantity: 1
          }]
        });
      } else {
        this.setData({
          selectedProducts: this.data.selectedProducts.filter(item => item.id !== id)
        });
      }
      
      this.calculateMarketExpectedReturn();
    }
  },

  /**
   * 删除已选商品
   */
  removeProduct(e) {
    const id = e.currentTarget.dataset.id;
    
    this.setData({
      selectedProducts: this.data.selectedProducts.filter(item => item.id !== id)
    });
    
    const productList = this.data.productList;
    const index = productList.findIndex(item => item.id === id);
    if (index !== -1) {
      this.setData({
        [`productList[${index}].selected`]: false
      });
    }
    
    const filteredIndex = this.data.filteredProductList.findIndex(item => item.id === id);
    if (filteredIndex !== -1) {
      this.setData({
        [`filteredProductList[${filteredIndex}].selected`]: false
      });
    }
    
    this.calculateMarketExpectedReturn();
  },

  /**
   * 计算行情报单的预计回款
   */
  calculateMarketExpectedReturn() {
    const selectedProducts = this.data.selectedProducts;
    let totalReturn = 0;
    
    selectedProducts.forEach(product => {
      const price = product.price;
      const quantity = product.quantity;
      let profit = price * 0.094;
      
      if (profit > 10) {
        profit = price - 10;
      } else {
        profit = price * 0.094;
      }
      
      totalReturn += profit * quantity;
    });
    
    this.setData({
      expectedReturn: totalReturn.toFixed(2)
    });
  },

  /**
   * 提交表单
   */
  submitForm() {
    const { formType, formData, currentPlan, selectedProducts } = this.data;
    
    // 表单验证
    if (formType === 'normal') {
      if (!currentPlan) {
        wx.showToast({ title: '请选择方案', icon: 'none' });
        return;
      }
      if (!formData.expressNumber) {
        wx.showToast({ title: '请输入快递单号', icon: 'none' });
        return;
      }
      if (currentPlan.id === 1 && !formData.orderNumber) {
        wx.showToast({ title: '请输入订单编号', icon: 'none' });
        return;
      }
      if (!formData.quantity) {
        wx.showToast({ title: '请输入下单数量', icon: 'none' });
        return;
      }
    } else if (formType === 'market') {
      if (selectedProducts.length === 0) {
        wx.showToast({ title: '请选择至少一个商品', icon: 'none' });
        return;
      }
      if (!formData.expressNumber) {
        wx.showToast({ title: '请输入快递单号', icon: 'none' });
        return;
      }
    }
    
    // 准备提交数据
    const submitData = {
      type: formType,
      planId: formType === 'normal' ? currentPlan.id : null,
      products: formType === 'market' ? selectedProducts.map(p => ({
        id: p.id,
        quantity: p.quantity
      })) : null,
      expressNumber: formData.expressNumber,
      orderNumber: formData.orderNumber,
      quantity: formData.quantity,
      remark: formData.remark
    };
    
    // 提交表单
    wx.showLoading({ title: '提交中...' });
    
    // TODO: 调用后端接口提交表单
    wx.request({
      url: 'https://api.example.com/orders',
      method: 'POST',
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 0) {
          wx.showToast({ title: '提交成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})