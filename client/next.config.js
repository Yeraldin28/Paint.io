const withPlugins = require('next-compose-plugins');
const withCSS = require('@zeit/next-css');
const withTM = require('next-transpile-modules')(['tailwindcss']);

module.exports = withPlugins([withCSS, withTM], {
  experimental: {
    appDir: true,
  },
});

