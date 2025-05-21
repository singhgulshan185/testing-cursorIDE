const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    devServer: {
    static: {
      directory: path.join(__dirname, "public")
    },
      compress: true,
      port: 3001,
    hot: true,
    open: true
  },
  devtool: 'source-map'
});
