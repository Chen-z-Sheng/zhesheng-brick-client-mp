const {
  fetchPlans,
  fetchFormTemplate
} = require('../../services/form-schemes');
const {
  fetchProducts,
  searchProducts
} = require('../../services/product');
const {
  submitOrder
} = require('../../services/order');

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
    searchTimer: null, // 用于延时搜索的定时器

    // 动态表单新增字段
    formTemplate: null, // 当前方案对应的表单模板
    dynamicFormRules: [], // 解析后的动态表单规则
    dynamicFormOptions: { // 默认表单配置
      form: {
        size: 'default',
        inline: false,
        labelWidth: '125px',
        labelPosition: 'right',
        hideRequiredAsterisk: false
      },
      resetBtn: {
        show: false,
        innerText: '重置'
      },
      submitBtn: {
        show: true,
        innerText: '提交'
      }
    },
    dynamicFormData: {} // 动态表单收集的数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const {
      type
    } = options;
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
    this.setData({
      isLoadingPlans: true
    });

    fetchPlans()
      .then((list = []) => {
        this.setData({
          planList: list,
          filteredPlanList: list,
          // 不自动选择方案
          planIndex: -1,
          currentPlan: null,
          planSearchText: '', // 输入框先保持空
          isLoadingPlans: false,
          // 确保动态表单区域也是空的
          formTemplate: null,
          dynamicFormRules: [],
          dynamicFormData: {}
        });
      })
      .catch(() => {
        wx.showToast({
          title: '获取方案失败',
          icon: 'none'
        });
        this.setData({
          isLoadingPlans: false
        });
      });
  },

  /**
   * 获取商品列表
   */
  getProductList() {
    this.setData({
      isLoadingProducts: true
    });

    fetchProducts()
      .then((list = []) => {
        this.setData({
          productList: list,
          filteredProductList: list,
          isLoadingProducts: false
        });
      })
      .catch(() => {
        wx.showToast({
          title: '获取商品失败',
          icon: 'none'
        });
        this.setData({
          isLoadingProducts: false
        });
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
   * 执行商品搜索
   */
  searchProducts(searchText) {
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    if (!searchText) {
      this.setData({
        filteredProductList: this.data.productList
      });
      return;
    }

    const timer = setTimeout(() => {
      this.setData({
        isLoadingProducts: true
      });

      searchProducts(searchText)
        .then((list = []) => {
          this.setData({
            filteredProductList: list,
            isLoadingProducts: false
          });
        })
        .catch(() => {
          wx.showToast({
            title: '搜索失败',
            icon: 'none'
          });
          this.setData({
            isLoadingProducts: false
          });
        });
    }, 500);

    this.setData({
      searchTimer: timer
    });
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

    // 这里用当前下拉列表的 index 就够了，没必要再去原始 list 找索引
    this.setData({
      planIndex: index,
      currentPlan: plan,
      showPlanDropdown: false,
      planSearchText: plan.name, // ✅ 让输入框显示选中的方案名
      formData: {
        address: plan.address || '',
        orderNumber: '',
        expressNumber: '',
        orderImage: '',
        quantity: '',
        expectedReturn: '0.00',
        remark: ''
      },
      dynamicFormData: {}
    });

    if (plan.templateId) {
      this.fetchAndParseFormTemplate(plan.templateId);
    } else {
      this.setData({
        formTemplate: null,
        dynamicFormRules: []
      });
    }
  },

  /**
   * 拉取并解析表单模板
   */
  fetchAndParseFormTemplate(templateId) {
    wx.showLoading({
      title: '加载表单模板...'
    });

    fetchFormTemplate(templateId)
      .then((template) => {
        const dynamicRules = this.parseFormRules(template.ruleJson);
        const rawOptions = template.optionJson || {};
        // 合并表单配置，避免可选链
        const dynamicOptions = {
          form: {
            size: 'default',
            inline: false,
            labelWidth: '125px',
            labelPosition: 'right',
            hideRequiredAsterisk: false,
            ...(rawOptions.form || {})
          },
          resetBtn: rawOptions.resetBtn || {
            show: false,
            innerText: '重置'
          },
          submitBtn: rawOptions.submitBtn || {
            show: true,
            innerText: '提交'
          }
        };

        this.setData({
          formTemplate: template,
          dynamicFormRules: dynamicRules,
          dynamicFormOptions: dynamicOptions,
          dynamicFormData: this.initDynamicFormData(dynamicRules)
        });
      })
      .catch(() => {
        wx.showToast({
          title: '加载表单模板失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 解析form-create的rule_json
   */
  parseFormRules(ruleJson) {
    if (!Array.isArray(ruleJson)) return [];

    return ruleJson.map(rule => {
      // 处理props默认值，避免undefined
      const props = rule.props || {};
      // 处理下拉选择的选项和索引
      const pickerRangeLabels = [];
      const pickerRangeValues = [];
      let pickerRangeIndex = 0;
      let selectedLabel = '';

      if (Array.isArray(rule.options)) {
        rule.options.forEach((opt, idx) => {
          pickerRangeLabels.push(opt.label);
          pickerRangeValues.push(opt.value);
        });
      }

      return {
        ...rule,
        bindField: rule.field || rule.name || '',
        required: rule.$required || false,
        inputType: props.type || (rule.type === 'password' ? 'password' : 'text'),
        options: rule.options || [],
        pickerRangeLabels: pickerRangeLabels,
        pickerRangeValues: pickerRangeValues,
        pickerRangeIndex: pickerRangeIndex,
        selectedLabel: selectedLabel,
        disabled: rule.disabled || false,
        props: props
      };
    });
  },

  /**
   * 初始化动态表单数据
   */
  initDynamicFormData(rules) {
    const initData = {};
    rules.forEach(rule => {
      if (rule.type === 'checkbox') {
        initData[rule.bindField] = rule.value || [];
      } else {
        initData[rule.bindField] = rule.value || '';
      }
    });
    return initData;
  },

  /**
   * 动态表单输入变化处理
   */
  onDynamicInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`dynamicFormData.${field}`]: value
    });

    // 更新下拉选择的标签和索引
    this.updateSelectLabel(field, value);
  },

  /**
   * 动态多选框变化处理
   */
  onDynamicCheckboxChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`dynamicFormData.${field}`]: value
    });
  },

  /**
   * 动态下拉选择处理
   */
  onDynamicSelectChange(e) {
    const field = e.currentTarget.dataset.field;
    const options = e.currentTarget.dataset.options;
    const selectedIndex = e.detail.value;
    const selectedValue = options[selectedIndex] ? options[selectedIndex].value : '';
    const selectedLabel = options[selectedIndex] ? options[selectedIndex].label : '';

    // 更新表单值
    this.setData({
      [`dynamicFormData.${field}`]: selectedValue
    });

    // 更新规则中的选中标签和索引
    const dynamicRules = this.data.dynamicFormRules.map(rule => {
      if (rule.bindField === field) {
        return {
          ...rule,
          pickerRangeIndex: selectedIndex,
          selectedLabel: selectedLabel
        };
      }
      return rule;
    });
    this.setData({
      dynamicFormRules: dynamicRules
    });
  },

  /**
   * 更新下拉选择的标签
   */
  updateSelectLabel(field, value) {
    const dynamicRules = this.data.dynamicFormRules.map(rule => {
      if (rule.bindField === field && rule.type === 'select') {
        let selectedLabel = '';
        let pickerRangeIndex = 0;
        rule.options.forEach((opt, idx) => {
          if (opt.value === value) {
            selectedLabel = opt.label;
            pickerRangeIndex = idx;
          }
        });
        return {
          ...rule,
          pickerRangeIndex: pickerRangeIndex,
          selectedLabel: selectedLabel
        };
      }
      return rule;
    });
    this.setData({
      dynamicFormRules: dynamicRules
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
      const newProductList = [...productList];
      newProductList[index].selected = selected;

      // 更新过滤后的商品列表
      const filteredProductList = [...this.data.filteredProductList];
      const filteredIndex = filteredProductList.findIndex(item => item.id === id);
      if (filteredIndex !== -1) {
        filteredProductList[filteredIndex].selected = selected;
      }

      // 更新已选商品
      let selectedProducts = [...this.data.selectedProducts];
      if (selected) {
        selectedProducts.push({
          ...productList[index],
          quantity: 1
        });
      } else {
        selectedProducts = selectedProducts.filter(item => item.id !== id);
      }

      this.setData({
        productList: newProductList,
        filteredProductList: filteredProductList,
        selectedProducts: selectedProducts
      });

      this.calculateMarketExpectedReturn();
    }
  },

  /**
   * 删除已选商品
   */
  removeProduct(e) {
    const id = e.currentTarget.dataset.id;

    const selectedProducts = this.data.selectedProducts.filter(item => item.id !== id);
    this.setData({
      selectedProducts: selectedProducts
    });

    // 取消商品选中状态
    const productList = [...this.data.productList];
    const index = productList.findIndex(item => item.id === id);
    if (index !== -1) {
      productList[index].selected = false;
    }

    const filteredProductList = [...this.data.filteredProductList];
    const filteredIndex = filteredProductList.findIndex(item => item.id === id);
    if (filteredIndex !== -1) {
      filteredProductList[filteredIndex].selected = false;
    }

    this.setData({
      productList: productList,
      filteredProductList: filteredProductList
    });

    this.calculateMarketExpectedReturn();
  },

  /**
   * 减少商品数量
   */
  decreaseQuantity(e) {
    const id = e.currentTarget.dataset.id;
    const selectedProducts = [...this.data.selectedProducts];
    const index = selectedProducts.findIndex(item => item.id === id);

    if (index !== -1 && selectedProducts[index].quantity > 1) {
      selectedProducts[index].quantity -= 1;
      this.setData({
        selectedProducts: selectedProducts
      });
      this.calculateMarketExpectedReturn();
    }
  },

  /**
   * 增加商品数量
   */
  increaseQuantity(e) {
    const id = e.currentTarget.dataset.id;
    const selectedProducts = [...this.data.selectedProducts];
    const index = selectedProducts.findIndex(item => item.id === id);

    if (index !== -1) {
      selectedProducts[index].quantity += 1;
      this.setData({
        selectedProducts: selectedProducts
      });
      this.calculateMarketExpectedReturn();
    }
  },

  /**
   * 商品数量输入变化
   */
  onQuantityChange(e) {
    const id = e.currentTarget.dataset.id;
    const value = parseInt(e.detail.value) || 1;
    const selectedProducts = [...this.data.selectedProducts];
    const index = selectedProducts.findIndex(item => item.id === id);

    if (index !== -1) {
      selectedProducts[index].quantity = value < 1 ? 1 : value;
      this.setData({
        selectedProducts: selectedProducts
      });
      this.calculateMarketExpectedReturn();
    }
  },

  /**
   * 计算行情报单的预计回款
   */
  calculateMarketExpectedReturn() {
    const selectedProducts = this.data.selectedProducts;
    let totalReturn = 0;

    selectedProducts.forEach(product => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 0;
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
   * 普通表单输入变化
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 方案搜索输入
   */
  onPlanSearchInput(e) {
    const value = e.detail.value;

    // 文本框自身回显
    this.setData({
      planSearchText: value,
    });

    // 防抖：清除上一次定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    const kw = (value || '').trim();

    // 如果输入为空，恢复原始列表，顺便可以关闭下拉
    if (!kw) {
      this.setData({
        filteredPlanList: this.data.planList,
        isLoadingPlans: false,
        showPlanDropdown: false, // 或者 true，看你想不想一直展开
      });
      return;
    }

    const timer = setTimeout(() => {
      this.setData({
        isLoadingPlans: true,
        showPlanDropdown: true, // ✅ 输入时自动展开下拉列表，这样你能看到变化
      });

      // ✅ 这里是“引入的函数”，不是 this.fetchPlans
      fetchPlans(kw)
        .then((list = []) => {
          this.setData({
            filteredPlanList: list, // ✅ 用搜索结果覆盖下拉列表
            isLoadingPlans: false,
          });
        })
        .catch(() => {
          wx.showToast({
            title: '搜索失败',
            icon: 'none',
          });
          this.setData({
            isLoadingPlans: false,
          });
        });
    }, 300); // 防抖时间可以自己调

    this.setData({
      searchTimer: timer,
    });
  },

  /**
   * 商品搜索输入
   */
  onProductSearchInput(e) {
    const value = e.detail.value;
    this.setData({
      productSearchText: value
    });
    this.searchProducts(value);
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          [`formData.orderImage`]: tempFilePath
        });
      }
    });
  },

  /**
   * 保存草稿
   */
  saveDraft() {
    // 草稿保存逻辑（根据需求实现）
    wx.showToast({
      title: '草稿保存成功',
      icon: 'success'
    });
  },

  /**
   * 提交表单
   */
  async submitForm() {
    const {
      formType,
      formData,
      currentPlan,
      selectedProducts,
      dynamicFormRules,
      dynamicFormData
    } = this.data;

    // 普通方案报单验证
    if (formType === 'normal') {
      if (!currentPlan) {
        wx.showToast({
          title: '请选择方案',
          icon: 'none'
        });
        return;
      }

      // 验证动态表单必填项
      const requiredErrors = [];
      dynamicFormRules.forEach(rule => {
        if (rule.required) {
          const value = dynamicFormData[rule.bindField];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            requiredErrors.push(`请填写【${rule.title}】`);
          }
        }
      });
      if (requiredErrors.length > 0) {
        wx.showToast({
          title: requiredErrors[0],
          icon: 'none'
        });
        return;
      }

      // 核心字段验证
      if (!formData.expressNumber) {
        wx.showToast({
          title: '请输入快递单号',
          icon: 'none'
        });
        return;
      }
    }
    // 行情报单验证
    else if (formType === 'market') {
      if (selectedProducts.length === 0) {
        wx.showToast({
          title: '请选择至少一个商品',
          icon: 'none'
        });
        return;
      }
      if (!formData.expressNumber) {
        wx.showToast({
          title: '请输入快递单号',
          icon: 'none'
        });
        return;
      }
    }

    // 构造提交数据
    const submitData = {
      type: formType,
      planId: formType === 'normal' ? currentPlan.id : null,
      templateId: formType === 'normal' ? currentPlan.templateId : null,
      products: formType === 'market' ? selectedProducts.map(p => ({
        id: p.id,
        quantity: p.quantity
      })) : null,
      expressNumber: formData.expressNumber,
      remark: formData.remark,
      dynamicFormData: dynamicFormData,
      address: formData.address,
      orderNumber: formData.orderNumber,
      quantity: formData.quantity,
      orderImage: formData.orderImage,
      expectedReturn: formType === 'normal' ? formData.expectedReturn : this.data.expectedReturn
    };

    try {
      wx.showLoading({
        title: '提交中...'
      });
      await submitOrder(submitData);
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.showToast({
        title: err?.message || '提交失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});