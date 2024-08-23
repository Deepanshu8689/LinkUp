const webpack = require('webpack');

module.exports = {
  // Other configurations
  target: 'web',
  resolve: {
    fallback: {
      // buffer: require.resolve('buffer/')
      "process": require.resolve("process/browser")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    // Other plugins ...
  ]
};

const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  // Other configurations ...
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      fs: false,
      net: false,
      tls: false,
      process: require.resolve('process/browser')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new NodePolyfillPlugin(),
    // Other plugins ...
  ]
};

webpack.config.js
// const webpack = require('webpack');

// module.exports = {
//   // other configuration settings
//   plugins: [
//     new webpack.ProvidePlugin({
//       process: 'process/browser',
//     }),
//   ],
// };
