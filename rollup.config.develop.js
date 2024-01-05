import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/index.ts",
	output: {
		format: "iife",
		file: "./build/openrct2-rctris-develop.js",
	},
	plugins: [
		resolve(),
		typescript(),
	],
};
