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
        name: "proxy_frame",
        type: "var"
      }
    },
    mode: "development"
  },
  {
    name: "host",
    dependencies: ["frame"],
    entry: "./src/host/index.mjs",
    output: {
      filename: "host.js",
      library: {
        name: "proxy_host",
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