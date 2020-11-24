// @format

const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: './src/index.ts',
	plugins: [
		new HTMLWebpackPlugin({
			title: 'Mandelbrot Renderer',
			template: './src/index.html',
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	devtool: 'source-map',
	optimization: {
		minimize: false,
	},
	devServer: {
		port: 3000,
		contentBase: path.resolve(__dirname, 'dist'),
	},
}
