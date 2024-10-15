const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');

const pkg = require("./package.json");
const { execSync } = require("child_process");
const git_hash = execSync("git rev-parse --short HEAD").toString().trim();
const git_tag = execSync("git tag -l --contains HEAD").toString().trim();
let version = pkg.version;
if (!git_tag) version += "-dev";

const banner_text = `
ading2210/sandstone - A web proxy using sandboxed iframes 
Copyright (C) 2024 ading2210

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Source code: https://github.com/ading2210/sandstone
License: https://github.com/ading2210/sandstone/blob/main/LICENSE
`

const bundles = [
  {
    name: "sandstone_frame",
    entry: "./src/frame/index.mjs",
    output: {
      filename: "sandstone_frame.js",
      library: {
        name: "sandstone_frame",
        type: "var"
      }
    },
    mode: "development"
  },
  {
    name: "sandstone",
    dependencies: ["sandstone_frame"],
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
          resource: /dist\/sandstone_frame\.js$/,
          type: "asset/source"
        },
      ],
    },
    mode: "development",
    optimization: {
      minimizer: [
        new TerserPlugin({extractComments: false})
      ],
    },  
    plugins: [
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(version),
        __GIT_HASH__: JSON.stringify(git_hash)
      }),
      new webpack.BannerPlugin({banner: banner_text.trim()})
    ]
  },
];

bundles.push({
  ...bundles[1],
  name: bundles[1].name + "_es6",
  experiments: {outputModule: true},
  output: {
    filename: "sandstone.mjs",
    library: {
      type: "module"
    }
  }
});

module.exports = bundles;