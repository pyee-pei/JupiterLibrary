import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/main.js',
    output: [
        {
            file: 'bundle.js',
            format: 'cjs'
        },
        {
            file: 'jupiter.min.js',
            format: 'iife',
            name: 'jupiter',
            plugins: [terser()]
        }
    ],
    plugins: [json()]
};