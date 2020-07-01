const path = require("path");
const fs = require("fs");

// Identify installed packages
// https://jlongster.com/Backend-Apps-with-Webpack--Part-I
const nodeModules = {};
fs.readdirSync(path.resolve(__dirname, 'node_modules'))
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = (env, argv) => {

  const isProduction = argv.mode === "production";

  return {
    entry: "./src/bot.ts",
    target: "node",
    output: {
      filename: "bot.js",
      path: path.resolve(__dirname, "build")
    },

    /*
     * Disable NodeJS mocking
     */
    node: false,

    /*
     * Do not bundle external packages
     */
    externals: nodeModules,

    /*
     * For production, we output a separate source map file
     * that is optionally loaded. For development, we inline it.
     */
    devtool: "inline-source-map",
    
    module: {
      rules: [
        /*
         * Compile TypeScript files and run the output through Babel
         */
        {
          test: /\.tsx?$/,
          exclude: [ /node_modules/, /tests/ ],
          use: [
            {
              loader: "babel-loader"
            },
            {
              loader: "ts-loader",
              options: {
                configFile: "tsconfig.json"
              }
            }
          ]
        },
      ]
    },
    resolve: {
      extensions: [ ".ts", ".tsx", ".js", ]
    },
    optimization: {
      minimize: false,
      splitChunks: false
    }
  };
};