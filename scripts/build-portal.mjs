import fs from 'node:fs/promises';
import { build } from 'esbuild';

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/assets', { recursive: true });
await fs.cp('public', 'dist', { recursive: true });
await fs.copyFile('src/globals.css', 'dist/assets/portal.css');
await fs.writeFile('dist/index.html', `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Planilha e evidências de consultas de PAFs, organizadas por mês para consulta e download."><title>Consulta PAFs | SEFAZ BA</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/assets/portal.css"></head><body><div id="root"></div><noscript>Ative o JavaScript para consultar as pastas e os arquivos.</noscript><script type="module" src="/assets/portal.js"></script></body></html>`);
await build({ entryPoints: ['src/main.tsx'], bundle: true, format: 'esm', outfile: 'dist/assets/portal.js', jsx: 'automatic', minify: true, target: ['es2020'], define: { 'process.env.NODE_ENV': '"production"' } });
