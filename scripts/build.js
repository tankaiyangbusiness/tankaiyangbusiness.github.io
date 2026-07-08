import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

await esbuild.build({
    entryPoints: [path.join(root, 'js', 'main.js')],
    outfile: path.join(root, 'game.bundle.js'),
    bundle: true,
    format: 'iife',
    target: ['es2020'],
    platform: 'browser',
    sourcemap: true,
    minify: false,
    logLevel: 'info'
});

console.log('Built game.bundle.js — works with file://, http://, and GitHub Pages');
