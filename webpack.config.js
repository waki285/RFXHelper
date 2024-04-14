module.exports = {
  mode: 'development',

  entry: './src/index.ts',
  output: {
    path: `${__dirname}/dist`,
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript'
              ]
            }
          }
        ]
      }
    ]
  },
  target: ["web", "es5"],
};