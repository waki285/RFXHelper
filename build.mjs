// @ts-check
import { context } from "esbuild";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("./package.json", "utf-8")).version;

const IS_DEV = process.env.NODE_ENV === "development";

const ctx = await context({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  minify: !IS_DEV,
  sourcemap: IS_DEV ? "inline" : false,
  target: "esnext",
  outfile: "./dist/index.js",
  legalComments: "none",
  logLevel: "info",
  tsconfig: "./tsconfig.json",
  platform: "browser",
  format: "iife",
  allowOverwrite: true,
  banner: {
    js: `// *************************\n// @name RFXHelper\n// @namespace Waki285\n// @author [[User:Waki285]]\n// @version ${version}\n// *************************\n// This code is compressed! Uncompressed: https://github.com/waki285/RFXHelper\n//<nowiki>\n/* global mw, $, OO */\n/* jshint ignore:start */\n`,
  },
  footer: {
    js: "/* jshint ignore:end */\n//</nowiki>",
  },
  charset: "utf8",
});

await ctx.rebuild();

process.exit(0);
