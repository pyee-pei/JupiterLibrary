import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/jupiter.js',
    output: [
        {
            file: 'dist/bundle.js',
            format: 'cjs'
        },
        {
            file: 'dist/jupiter.min.js',
            format: 'iife',
            name: 'JupiterDoc',
            plugins: [terser()]
        }
    ],
    plugins: [json()]
};