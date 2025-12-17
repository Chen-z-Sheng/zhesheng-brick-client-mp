const {
  fetchPlans,
  fetchFormTemplate
} = require('../../services/form-schemes');
const {
  fetchProducts,
  searchProducts
} = require('../../services/product');
const {
  saveFormSubmission, // ✅ 替换成保存表单提交记录的方法
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
    productList: [], // 商品列表
    filteredProductList: [], // 过滤后的商品列表
    productSearchText: '', // 商品搜索文本
    showProductDropdown: false, // 是否显示商品下拉框
    productInputFocus: false, // 商品输入框是否获取焦点
    isLoadingProducts: false, // 是否正在加载商品
    selectedProducts: [], // 已选商品列表
    expectedReturn: '0.00', // 预计回款金额（行情报单用）
    searchTimer: null, // 用于延时搜索的定时器

    // 动态表单核心数据（完全接管表单渲染/数据/验证）
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
    dynamicFormData: {} // 所有表单数据都存储在这里
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
          planIndex: -1,
          currentPlan: null,
          planSearchText: '',
          isLoadingPlans: false,
          // 清空动态表单相关数据
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

    this.setData({
      planIndex: index,
      currentPlan: plan,
      showPlanDropdown: false,
      planSearchText: plan.name,
      dynamicFormData: {} // 清空动态表单数据
    });

    if (plan.templateId) {
      this.fetchAndParseFormTemplate(plan.templateId, plan); // 传入plan用于默认值注入
    } else {
      this.setData({
        formTemplate: null,
        dynamicFormRules: [],
        dynamicFormData: {}
      });
    }
  },

  /**
   * 拉取并解析表单模板
   * @param {string} templateId 模板ID
   * @param {object} plan 选中的方案（用于注入默认值）
   */
  fetchAndParseFormTemplate(templateId, plan) {
    wx.showLoading({
      title: '加载表单模板...'
    });

    fetchFormTemplate(templateId)
      .then((template) => {
        const dynamicRules = this.parseFormRules(template.ruleJson);
        const rawOptions = template.optionJson || {};
        // 合并表单配置
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

        // 初始化动态表单数据，并注入方案的默认值（如address）
        const initData = this.initDynamicFormData(dynamicRules);
        if (plan?.address) {
          // 需确保模板中存在address字段才会生效
          initData.address = plan.address;
        }

        this.setData({
          formTemplate: template,
          dynamicFormRules: dynamicRules,
          dynamicFormOptions: dynamicOptions,
          dynamicFormData: initData
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
   * 解析form-create的rule_json（增强版，支持更多组件类型）
   */
  parseFormRules(ruleJson) {
    if (!Array.isArray(ruleJson)) return [];

    return ruleJson.map(rule => {
      // 处理props默认值
      const props = rule.props || {};
      // 处理下拉选择的选项
      const pickerRangeLabels = [];
      const pickerRangeValues = [];
      let pickerRangeIndex = 0;
      let selectedLabel = '';

      if (Array.isArray(rule.options)) {
        rule.options.forEach((opt, idx) => {
          pickerRangeLabels.push(opt.label);
          pickerRangeValues.push(opt.value);
          // 初始化选中状态（如果有默认值）
          if (rule.value === opt.value) {
            pickerRangeIndex = idx;
            selectedLabel = opt.label;
          }
        });
      }

      // 处理输入框类型
      let inputType = 'text';
      if (rule.type === 'password') {
        inputType = 'password';
      } else if (rule.type === 'number') {
        inputType = 'number';
      } else if (props.type) {
        inputType = props.type;
      }

      return {
        ...rule,
        bindField: rule.title || rule.name || '', // 字段标识
        required: rule.$required || false, // 必填标识（后端已经补好了 $required）
        inputType: inputType, // 输入框类型
        options: rule.options || [], // 下拉选项
        pickerRangeLabels: pickerRangeLabels, // 下拉标签列表
        pickerRangeValues: pickerRangeValues, // 下拉值列表
        pickerRangeIndex: pickerRangeIndex, // 选中索引
        selectedLabel: selectedLabel, // 选中标签
        disabled: rule.disabled || false, // 是否禁用
        props: props, // 组件属性
        componentType: rule.type || 'input' // 组件类型（用于WXML渲染）
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
   * 动态表单输入变化处理（文本、数字等）
   */
  onDynamicInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`dynamicFormData.${field}`]: value
    });

    // 更新下拉选择的标签和索引（针对手动输入的select类型）
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

    // 更新规则中的选中状态
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
   * 更新下拉选择的标签（针对手动输入的情况）
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
   * 动态图片选择（替代原硬编码的图片选择）
   */
  chooseDynamicImage(e) {
    const field = e.currentTarget.dataset.field;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          [`dynamicFormData.${field}`]: tempFilePath
        });
      },
      fail: () => {
        wx.showToast({
          title: '图片选择失败',
          icon: 'none'
        });
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
   * 方案搜索输入
   */
  onPlanSearchInput(e) {
    const value = e.detail.value;

    this.setData({
      planSearchText: value,
    });

    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    const kw = (value || '').trim();

    if (!kw) {
      this.setData({
        filteredPlanList: this.data.planList,
        isLoadingPlans: false,
        showPlanDropdown: false,
      });
      return;
    }

    const timer = setTimeout(() => {
      this.setData({
        isLoadingPlans: true,
        showPlanDropdown: true,
      });

      fetchPlans(kw)
        .then((list = []) => {
          this.setData({
            filteredPlanList: list,
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
    }, 300);

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
   * 公共：构造提交/草稿的 payload
   */
  buildSubmitData() {
    const {
      formType,
      currentPlan,
      selectedProducts,
      dynamicFormData
    } = this.data;

    return {
      type: formType,
      planId: formType === 'normal' && currentPlan ? currentPlan.id : null,
      templateId: formType === 'normal' && currentPlan ? currentPlan.templateId : null,
      products: formType === 'market' ?
        selectedProducts.map(p => ({
          id: p.id,
          quantity: p.quantity
        })) :
        null,
      dynamicFormData: dynamicFormData,
      expectedReturn: formType === 'normal' ?
        (dynamicFormData.expectedReturn || '0.00') :
        this.data.expectedReturn
    };
  },

  /**
   * 保存草稿：不做必填校验，直接 status=0
   */
  async saveDraft() {
    const submitData = this.buildSubmitData();

    try {
      wx.showLoading({
        title: '保存草稿中...'
      });

      await saveFormSubmission({
        ...submitData,
        status: 0, // 0 = 草稿
      });

      wx.showToast({
        title: '草稿保存成功',
        icon: 'success'
      });
    } catch (err) {
      wx.showToast({
        title: err?.message || '草稿保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 提交表单（核心改造：依赖动态表单 + status=1）
   */
  async submitForm() {
    const {
      formType,
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

      // 动态表单必填项验证
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

      // 行情报单如果有动态表单，也需要验证必填项
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
    }

    // 构造提交数据（和草稿共用）
    const submitData = this.buildSubmitData();

    try {
      wx.showLoading({
        title: '提交中...'
      });

      await saveFormSubmission({
        ...submitData,
        status: 1, // 1 = 已提交
      });

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