/* eslint-disable import/no-extraneous-dependencies */
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
// import resolve from '@rollup/plugin-node-resolve';
// import cjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    inlineDynamicImports: true,
  },
  plugins: [json(), typescript(), terser()],
};
