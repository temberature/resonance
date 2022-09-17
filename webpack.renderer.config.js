const rules = require('./webpack.rules');
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  devServer: {
    hot: false,
    inline: false,
    liveReload: false
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "src", "data"), to: "data" },

      ],
    }),
  ],
  module: {
    rules,
  },
};
