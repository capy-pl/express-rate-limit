const path = require("path");

module.exports = {
  mode: "production",
  target: "node",
  entry: path.resolve(__dirname, "src", "index.ts"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "babel-loader"
      }
    ]
  }
};
