import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/main.ts",
  output: {
    file: "build/index.js",
    format: "iife",
    name: "nakama",
    sourcemap: false,
    extend: true,
    footer: "// Nakama entrypoint\nvar InitModule = nakama.InitModule;",
  },
  plugins: [
    resolve({ browser: false }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
};
