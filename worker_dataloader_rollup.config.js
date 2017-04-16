//import babel from 'rollup-plugin-babel';
//import babelrc from 'babelrc-rollup';
//import istanbul from 'rollup-plugin-istanbul';

import { rollup } from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import multiEntry from 'rollup-plugin-multi-entry';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-js';

//let pkg = require('./package.json');

//let external = Object.keys(pkg.dependencies);

export default {
  entry: ['./stage/worker_dataloader/worker_dataloader.js'],
  dest: './dist/worker_dataloader.js',
  plugins: [

       nodeResolve({
           jsnext: true,
           main: true,
           //module: true,
         }),

        typescript()

        ,

        multiEntry()
        ,














//
      commonjs({
        // non-CommonJS modules will be ignored, but you can also
        // specifically include/exclude files
        include: [
          'node_modules/**',
          'typings/**'
        ],  // Default: undefined
        //exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined

        // search for files other than .js files (must already
        // be transpiled by a previous plugin!)
        //extensions: [ '.js', '.coffee' ],  // Default: [ '.js' ]

        // if true then uses of `global` won't be dealt with by this plugin
        //ignoreGlobal: false,  // Default: false

        // if false then skip sourceMap generation for CommonJS modules
        //sourceMap: false,  // Default: true

        // explicitly specify unresolvable named exports
        // (see below for more details)
        //namedExports: { './module.js': ['foo', 'bar' ] }  // Default: undefined

        /*
        namedExports: {
          'node_modules/dexie/dist/dexie.es.js': [ 'Dexie' ]
        }
        */

      }),

      babel({
        exclude: 'node_modules/**'
      }),

      //  uglify({}, minify)


    //babel(babelrc()),
    //istanbul({
    //  exclude: ['test/**/*', 'node_modules/**/*']
    //})
  ],
  // parserOptions: {
  //  sourceType: "treeshake"
  // },
  //external: external,
  //external: [ 'dexie' ],



  targets: [
    //{
    //  dest: pkg['main'],
    //  format: 'umd',
   //   moduleName: 'rollupStarterProject',
   //   sourceMap: true
   // },
    {
      //dest: pkg['jsnext:main'],
      format: 'es',
      sourceMap: true
    }
  ]
};
