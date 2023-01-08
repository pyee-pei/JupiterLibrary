import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/main.js',
    externals: ['jupiter.js'],
    output: [
        {
            file: 'dist/bundle.js',
            format: 'cjs'
        },
        {
            file: 'dist/jupiter.min.js',
            format: 'iife',
            name: 'jupiter',
            globals: {
                'jupiter.js': 'jupiter'
            },
            plugins: [terser()]
        }
    ],
    plugins: [json()]
};