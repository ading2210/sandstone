module.exports = {
  name: "sandstone_frontend",
  entry: "./main.mjs",
  output: {
    filename: "sandstone_frontend.js"
  },
  module: {
    rules: [
      {
        resource: /resources\/.+\.html$/,
        type: "asset/source"
      },
    ],
  },
  mode: "development"
}