Page({
  data: {
    productId: null,
    productName: '',
    price: 0,
    updateDate: '',
    specs: [{
        name: "容量",
        options: ["128G", "256G", "512G"]
      },
      {
        name: "颜色",
        options: ["白色", "黑色", "钛色"]
      }
    ],
    selectedSpecs: {
      "容量": "128G",
      "颜色": "白色"
    },
    period: 7, // 默认显示7天
    trendDirection: 'up', // 默认趋势为上涨
    vendors: [],
    priceHistory: []
  },

  onLoad: function (options) {
    // 从URL参数获取商品信息
    const {
      id,
      name,
      price
    } = options;

    // 获取当前日期作为更新日期
    const today = new Date();
    const updateDate = `${today.getMonth() + 1}月${today.getDate()}日更新`;

    this.setData({
      productId: id,
      productName: name || '',
      price: price || 0,
      updateDate: updateDate
    });

    // 加载商品详情数据
    this.loadProductDetails();

    // 加载历史价格数据
    this.loadPriceHistory();

    // 加载档口报价
    this.loadVendorPrices();
  },

  onReady: function () {
    // 页面渲染完成后绘制图表
    setTimeout(() => {
      this.drawPriceChart();
    }, 300);
  },

  // 加载商品详情数据
  loadProductDetails: function () {
    // 这里应该是从服务器获取数据
    // 示例数据
    const specs = [{
        name: "容量",
        options: ["128G", "256G", "512G"]
      },
      {
        name: "颜色",
        options: ["白色", "黑色", "钛色"]
      }
    ];

    this.setData({
      specs
    });
  },

  // 加载历史价格数据
  loadPriceHistory: function () {
    // 这里应该是从服务器获取数据
    // 生成示例数据
    this.generatePriceHistoryData(this.data.period);
  },

  // 生成示例历史价格数据
  generatePriceHistoryData: function (days) {
    const priceHistory = [];
    const basePrice = parseInt(this.data.price) || 1000;
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // 生成一个在基准价格上下浮动的随机价格
      const randomVariation = Math.floor(Math.random() * 200) - 100; // -100到100之间的随机数
      const price = basePrice + randomVariation;

      priceHistory.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        price: price
      });
    }

    // 根据价格趋势设置预测方向
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const trendDirection = lastPrice >= firstPrice ? 'up' : 'down';

    this.setData({
      priceHistory,
      trendDirection
    });

    // 重新绘制图表
    setTimeout(() => {
      this.drawPriceChart();
    }, 100);
  },

  // 加载档口报价
  loadVendorPrices: function () {
    // 这里应该是从服务器获取数据
    // 示例数据
    const basePrice = parseInt(this.data.price) || 1000;
    const vendors = [{
        id: 1,
        name: "A档口",
        price: basePrice - 50
      },
      {
        id: 2,
        name: "B档口",
        price: basePrice - 20
      },
      {
        id: 3,
        name: "C档口",
        price: basePrice
      },
      {
        id: 4,
        name: "D档口",
        price: basePrice - 100
      },
      {
        id: 5,
        name: "E档口",
        price: basePrice - 30
      }
    ];

    this.setData({
      vendors
    });
  },

  // 修改 drawPriceChart 函数中获取设备像素比的部分
  drawPriceChart: function () {
    const query = wx.createSelectorQuery();
    query.select('#priceChart')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          console.error('Canvas节点获取失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 使用新API获取设备像素比
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const width = res[0].width;
        const height = res[0].height;

        // 其余代码保持不变...
        // 清空画布
        ctx.clearRect(0, 0, width, height);

        const priceHistory = this.data.priceHistory;
        if (!priceHistory || priceHistory.length === 0) {
          return;
        }

        // 找出价格的最大值和最小值
        const prices = priceHistory.map(item => item.price);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const range = maxPrice - minPrice;

        // 设置图表尺寸和边距
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 40;
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // 绘制坐标轴
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#cccccc';
        ctx.moveTo(paddingLeft, paddingTop);
        ctx.lineTo(paddingLeft, height - paddingBottom);
        ctx.lineTo(width - paddingRight, height - paddingBottom);
        ctx.stroke();

        // 绘制价格线
        if (priceHistory.length > 1) {
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = this.data.trendDirection === 'up' ? '#fa5151' : '#07c160';

          for (let i = 0; i < priceHistory.length; i++) {
            const x = paddingLeft + (i / (priceHistory.length - 1)) * chartWidth;
            const normalizedPrice = (priceHistory[i].price - minPrice) / (range || 1);
            const y = height - paddingBottom - normalizedPrice * chartHeight;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        }

        // 绘制日期标签
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'center';

        const step = Math.max(1, Math.floor(priceHistory.length / 7)); // 最多显示7个日期标签

        for (let i = 0; i < priceHistory.length; i += step) {
          const x = paddingLeft + (i / (priceHistory.length - 1)) * chartWidth;
          const y = height - paddingBottom + 15;
          ctx.fillText(priceHistory[i].date, x, y);
        }

        // 绘制价格标签
        ctx.textAlign = 'right';

        const priceStep = range / 4; // 显示5个价格标签

        for (let i = 0; i <= 4; i++) {
          const price = minPrice + i * priceStep;
          const y = height - paddingBottom - (i / 4) * chartHeight;
          ctx.fillText('¥' + Math.round(price), paddingLeft - 5, y + 3);
        }
      });
  },

  // 选择规格
  selectSpec: function (e) {
    const {
      type,
      value
    } = e.currentTarget.dataset;
    const selectedSpecs = this.data.selectedSpecs;

    selectedSpecs[type] = value;

    this.setData({
      selectedSpecs
    });

    // 根据选择的规格重新加载价格等信息
    // 实际应用中应该从服务器获取对应规格的价格
    // 这里简单模拟一下价格变化
    let priceAdjustment = 0;

    if (selectedSpecs["容量"] === "256G") {
      priceAdjustment += 800;
    } else if (selectedSpecs["容量"] === "512G") {
      priceAdjustment += 1600;
    }

    if (selectedSpecs["颜色"] === "钛色") {
      priceAdjustment += 200;
    }

    const basePrice = parseInt(this.data.price) - priceAdjustment;

    this.setData({
      price: basePrice + priceAdjustment
    });

    // 重新加载历史价格和档口报价
    this.loadPriceHistory();
    this.loadVendorPrices();
  },

  // 设置图表周期
  setPeriod: function (e) {
    const period = parseInt(e.currentTarget.dataset.period);

    this.setData({
      period
    });

    // 重新加载历史价格数据
    this.generatePriceHistoryData(period);
  }

})