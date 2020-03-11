const path = require("path")
module.exports = {
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.(sass|scss)$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: [".js", ".jsx", ".mjs", ".wasm", ".json", ".scss"]
    },
    entry: {
        testApp: [path.resolve(__dirname, "src/TestApp.jsx")],
    },
    output: {
        publicPath: "/dist",
        path: path.resolve(__dirname, "./dist"),
    },
    devServer: {
        compress: true,
        port: 10000
    }
}
