/**
 * @file rollup.config.js
 * @copyright 2018-present Karim Alibhai. All rights reserved.
 */
 
import typescript from 'rollup-plugin-typescript2'
import babel from 
'rollup-plugin-babel'

const pkg = require('./package.json')

export default {
  input: 'src/index.ts',

  output: {
    format: 'cjs',
    file: 'dist/index.js',
    sourcemap: true,
  },

  external: [].concat(
    Object.keys(pkg.dependencies),
    Object.keys(pkg.devDependencies),
    [
      'assert',
    ]
  ),

  plugins: [
    typescript(),
    babel(),
  ],
}
