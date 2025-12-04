Page({
  data: {
    categories: [],
    subcategories: [],
    products: [],
    activeCategory: 0,
    activeSubcategory: 0,
    categoryScrollLeft: 0,
    subcategoryScrollTop: 0,
    categoryItemWidth: 152, // 一级分类项宽度(120) + 右边距(16) + padding(16)
    subcategoryItemHeight: 80, // 二级分类项高度(48) + 下边距(16) + padding(16)
  },

  onLoad: function () {
    this.loadData();

    // 默认选中第一个一级分类和二级分类
    this.setData({
      activeCategory: 0,
      activeSubcategory: 0
    });

    // 获取系统信息，用于计算滚动位置
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight
        });
      }
    });
  },

  loadData: function () {
    const categories = [{
        id: 1,
        name: '苹果'
      },
      {
        id: 2,
        name: '海美'
      },
      {
        id: 3,
        name: '国美'
      },
      {
        id: 4,
        name: '港药'
      },
      {
        id: 5,
        name: '酒水'
      },
      {
        id: 6,
        name: '手机'
      },
      {
        id: 7,
        name: '电玩'
      },
      {
        id: 8,
        name: '相机'
      },
      {
        id: 9,
        name: '电脑'
      },
      {
        id: 10,
        name: '配件'
      }
    ];

    this.setData({
      categories
    });
    this.loadSubcategories(categories[0]);
  },

  loadSubcategories: function (category) {
    // 根据不同的一级分类返回不同的二级分类
    let subcategories = [];

    switch (category.name) {
      case '苹果':
        subcategories = [{
            id: 1,
            name: '苹果手机'
          },
          {
            id: 2,
            name: '苹果平板'
          },
          {
            id: 3,
            name: '苹果配件'
          },
        ];
        break;
      case '海美':
        subcategories = [{
            id: 4,
            name: '海美电视'
          },
          {
            id: 5,
            name: '海美冰箱'
          }
        ];
        break;
      case '国美':
        subcategories = [{
            id: 6,
            name: '国美电器'
          },
          {
            id: 7,
            name: '国美家电'
          }
        ];
        break;
      case '港药':
        subcategories = [{
            id: 8,
            name: '港药保健'
          },
          {
            id: 9,
            name: '港药美妆'
          }
        ];
        break;
      case '酒水':
        subcategories = [{
            id: 10,
            name: '白酒'
          },
          {
            id: 11,
            name: '红酒'
          },
          {
            id: 12,
            name: '洋酒'
          }
        ];
        break;
      case '手机':
        subcategories = [{
            id: 13,
            name: '安卓手机'
          },
          {
            id: 14,
            name: '苹果手机'
          },
          {
            id: 15,
            name: '手机配件'
          }
        ];
        break;
      case '电玩':
        subcategories = [{
            id: 16,
            name: '游戏机'
          },
          {
            id: 17,
            name: '游戏卡带'
          }
        ];
        break;
      case '相机':
        subcategories = [{
            id: 18,
            name: '单反相机'
          },
          {
            id: 19,
            name: '微单相机'
          },
          {
            id: 20,
            name: '镜头'
          }
        ];
        break;
      case '电脑':
        subcategories = [{
            id: 21,
            name: '笔记本'
          },
          {
            id: 22,
            name: '台式机'
          },
          {
            id: 23,
            name: '平板电脑'
          }
        ];
        break;
      case '配件':
        subcategories = [{
            id: 24,
            name: '键盘'
          },
          {
            id: 25,
            name: '鼠标'
          },
          {
            id: 26,
            name: '耳机'
          }
        ];
        break;
      default:
        subcategories = [{
            id: 27,
            name: '默认子分类1'
          },
          {
            id: 28,
            name: '默认子分类2'
          }
        ];
    }

    this.setData({
      subcategories,
      activeSubcategory: 0
    });

    // 加载该二级分类下的商品
    if (subcategories.length > 0) {
      this.loadProducts(subcategories[0]);
    }

    // 计算二级分类滚动位置
    this.calculateSubcategoryScrollTop(0);
  },

  loadProducts: function (subcategory) {
    // 根据不同的二级分类返回不同的商品
    let products = [];

    if (subcategory && subcategory.id) {
      // 为每个二级分类生成3-5个商品
      const productCount = Math.floor(Math.random() * 3) + 3; // 3-5个商品

      // 获取当前日期作为更新日期
      const today = new Date();
      const updateDate = `${today.getMonth() + 1}月${today.getDate()}日更新`;

      for (let i = 1; i <= productCount; i++) {
        const price = Math.floor(Math.random() * 900) + 100; // 100-999的随机价格
        products.push({
          id: subcategory.id * 100 + i,
          name: `${subcategory.name}商品${i}`,
          price: price,
          updateDate: updateDate,
          // 添加更多详情页需要的数据
          specs: [{
              name: "容量",
              options: ["128G", "256G", "512G"]
            },
            {
              name: "颜色",
              options: ["白色", "黑色", "钛色"]
            }
          ]
        });
      }
    }

    this.setData({
      products
    });
  },

  onCategorySelect: function (e) {
    const category = e.currentTarget.dataset.category;
    const index = e.currentTarget.dataset.index;

    // 更新选中状态
    this.setData({
      activeCategory: index
    });

    // 计算滚动位置，使选中项居中
    this.calculateCategoryScrollLeft(index);

    // 加载对应的二级分类
    this.loadSubcategories(category);
  },

  onSubCategorySelect: function (e) {
    const subcategory = e.currentTarget.dataset.subcategory;
    const index = e.currentTarget.dataset.index;

    // 更新选中状态
    this.setData({
      activeSubcategory: index
    });

    // 计算滚动位置，使选中项居中
    this.calculateSubcategoryScrollTop(index);

    // 加载对应的商品
    this.loadProducts(subcategory);
  },

  onProductSelect: function(e) {
    const product = e.currentTarget.dataset.product;
    
    // 修改为正确的页面路径
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}&name=${product.name}&price=${product.price}`,
      fail: function(err) {
        console.error('页面跳转失败', err);
        wx.showToast({
          title: '页面跳转失败，请检查配置',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  calculateCategoryScrollLeft: function (index) {
    // 计算一级分类滚动位置，使选中项居中
    const rpxToPx = this.data.windowWidth / 750; // 将rpx转换为px
    const itemWidth = this.data.categoryItemWidth * rpxToPx; // 每个分类项的宽度(px)
    const scrollViewWidth = this.data.windowWidth - 40 * rpxToPx; // 滚动视图宽度(px)，减去容器padding

    // 计算滚动位置，使选中项居中
    let scrollLeft = itemWidth * index - (scrollViewWidth - itemWidth) / 2;

    // 确保不会滚动到负值
    scrollLeft = Math.max(0, scrollLeft);

    // 计算最大滚动位置（防止滚动过头）
    const maxScrollLeft = itemWidth * this.data.categories.length - scrollViewWidth;
    scrollLeft = Math.min(scrollLeft, maxScrollLeft > 0 ? maxScrollLeft : 0);

    this.setData({
      categoryScrollLeft: scrollLeft
    });
  },

  calculateSubcategoryScrollTop: function (index) {
    // 计算二级分类滚动位置，使选中项居中
    const rpxToPx = this.data.windowWidth / 750; // 将rpx转换为px
    const itemHeight = this.data.subcategoryItemHeight * rpxToPx; // 每个分类项的高度(px)
    const scrollViewHeight = (this.data.windowHeight - 240 * rpxToPx); // 滚动视图高度(px)

    // 计算滚动位置，使选中项居中
    let scrollTop = itemHeight * index - (scrollViewHeight - itemHeight) / 2;

    // 确保不会滚动到负值
    scrollTop = Math.max(0, scrollTop);

    // 计算最大滚动位置（防止滚动过头）
    const maxScrollTop = itemHeight * this.data.subcategories.length - scrollViewHeight;
    scrollTop = Math.min(scrollTop, maxScrollTop > 0 ? maxScrollTop : 0);

    this.setData({
      subcategoryScrollTop: scrollTop
    });
  },

  onSearchInput: function (e) {
    // 处理搜索输入
    const searchText = e.detail.value;
    // 实现搜索逻辑，可以根据需要添加
    console.log('搜索关键词:', searchText);
  }
})