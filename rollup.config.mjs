/* eslint-disable import/no-extraneous-dependencies */
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
// import resolve from '@rollup/plugin-node-resolve';
// import cjs from '@rollup/plugin-commonjs';
// import terser from '@rollup/plugin-terser';
// import ignore from 'rollup-plugin-ignore';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    inlineDynamicImports: true,
    // sourcemap: true,
  },
  plugins: [json(), typescript()],
};
