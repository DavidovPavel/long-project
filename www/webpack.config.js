
"use strict";

const webpack = require( 'webpack' );
const path = require( 'path' );
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const NODE_ENV = process.env.NODE_ENV || 'development';

const extractLess = new ExtractTextPlugin({
    filename: "css/[name].css",
    disable: process.env.NODE_ENV === "development"
});

module.exports = {

    context: __dirname + '/app/src',

    entry: {
        dashboards: './dashboards/app.js'
    },

    output: {
        filename: '[name].js',
        library: '[name]',
        path: path.resolve(__dirname, 'app/build')
    },

    devtool: NODE_ENV === 'development' ? 'cheap-module-source-map' : false,

    module: {

        loaders: [
          {
              test: /\.js?$/,
              loader: "babel-loader",
              exclude: /\/node_modules\//,
              options: {
                  "presets": ["es2015"]
              }
          }

        ],

        rules: [

           {
               test: /\.less$/,
               use: extractLess.extract({
                   use: [{
                       loader: "css-loader",
                       options: {
                           minimize: true
                       }
                   }, {
                       loader: "less-loader"
                   }],
                   // use style-loader in development
                   fallback: "style-loader"
               })
           },

            {
                test: /\.html$/,
                loader: 'underscore-loader',
                options: {
                    engine: 'var _ = { escape: require(\'lodash.escape\') };\n',
                    minifierOptions: { collapseInlineTagWhitespace: true }
                }
            },

            {
                test: /\.(png|jpg|jpeg|gif|svg|ttf|eot|woff|woff2)$/,
                loader: "file-loader",
                options: {
                    name: '[path][name].[ext]?[hash]',
                    publicPath: 'app/build/'
                }
            }

        ]
    },

    plugins: [
        extractLess,
        new CleanWebpackPlugin(['app/build']),
        new webpack.ProvidePlugin( {
            Mn: 'backbone.marionette'
        }),
         new webpack.DefinePlugin({
             NODE_ENV: JSON.stringify(NODE_ENV),
             LANG: JSON.stringify('ru-RU')
         })
    ],

};

if (NODE_ENV === 'production') {
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: true,
                unsafe: true
            }
        }));
}