const path = require('path')
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const gitRevisionPlugin = new GitRevisionPlugin()

const mode = process.env.NODE_ENV || 'production'

module.exports = {
  output: {
    filename: `worker.js`,
    path: path.join(__dirname, 'dist'),
    sourceMapFilename: `worker.js.map`,
  },
  devtool: 'source-map',
  mode,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [],
  },
  plugins: [
    gitRevisionPlugin,
    new webpack.DefinePlugin({
      COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
}
