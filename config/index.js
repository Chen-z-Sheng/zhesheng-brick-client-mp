// 环境与基础配置
const envVersion = wx.getAccountInfoSync
  ? wx.getAccountInfoSync().miniProgram.envVersion
  : 'develop'; // develop | trial | release

const ENV_MAP = {
  develop: {
    BASE_URL: 'http://127.0.0.1:9066', // TODO: 替换为本地/测试域名
    TIMEOUT: 15000,
  },
  trial: {
    BASE_URL: 'https://api.example.com', // TODO: 替换为预发域名
    TIMEOUT: 15000,
  },
  release: {
    BASE_URL: 'https://api.example.com', // TODO: 替换为生产域名
    TIMEOUT: 15000,
  },
};

const currentEnv = ENV_MAP[envVersion] || ENV_MAP.develop;

module.exports = {
  ...currentEnv,
  ENV: envVersion,
};

