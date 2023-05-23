const withPlugins = require('next-compose-plugins');
const withCSS = require('@zeit/next-css');
const withTM = require('next-transpile-modules')(['tailwindcss']);

const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = withPlugins([withCSS, withTM], nextConfig);
