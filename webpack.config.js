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
    mode: "development"
  },
];