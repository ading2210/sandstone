const webpack = require("webpack");
const pkg = require("./package.json");
const { execSync } = require("child_process");
const git_hash = execSync("git rev-parse --short HEAD").toString().trim();

module.exports = [
  {
    name: "frame",
    entry: "./src/frame/index.mjs",
    output: {
      filename: "frame.js",
      library: {
        name: "sandstone_frame",
        type: "var"
      }
    },
    mode: "development"
  },
  {
    name: "sandstone",
    dependencies: ["frame"],
    entry: "./src/host/index.mjs",
    output: {
      filename: "sandstone.js",
      library: {
        name: "sandstone",
        type: "var"
      }
    },
    module: {
      rules: [
        {
          resource: /dist\/frame\.js$/,
          type: "asset/source"
        },
      ],
    },
    mode: "development",
    plugins: [
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(pkg.version),
        __GIT_HASH__: JSON.stringify(git_hash)
     })
    ]
  },
];