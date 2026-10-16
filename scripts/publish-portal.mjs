import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { BlobNotFoundError, get, head, put } from '@vercel/blob';
import { CATALOG_KEY, objectKey, readCatalog } from '../lib/catalog.mjs';

const args = process.argv.slice(2);
const initialize = args.includes('--initialize');
const sources = args.filter(arg => !arg.startsWith('--')).map(arg => path.resolve(arg));
if (!sources.length) throw new Error('Informe a pasta do pacote e, opcionalmente, a pasta de versões anteriores.');
const incoming = JSON.parse(await fs.readFile(path.join(sources[0], 'catalog.json'), 'utf8'));
if (incoming.version !== 1 || !Array.isArray(incoming.files) || !incoming.files.length) throw new Error('Pacote inválido.');
let current = null;
try { current = await readCatalog(); }
catch (error) { if (!(error instanceof BlobNotFoundError) && error.message !== 'Catálogo indisponível') throw error; }
if (current && JSON.stringify(current.value.files) === JSON.stringify(incoming.files)) {
  console.log(JSON.stringify({ status: 'already_published', revision: current.value.revision, files: incoming.files.length }));
  process.exit(0);
}
if (!current && !initialize) throw new Error('A primeira publicação exige --initialize.');
if (current && incoming.baseRevision !== current.value.revision) throw new Error('O catálogo mudou. Prepare um novo pacote.');
const byPath = new Map(incoming.files.map(file => [file.path, file]));
if (byPath.size !== incoming.files.length) throw new Error('Caminhos duplicados no pacote.');
for (const old of current?.value.files || []) {
  const next = byPath.get(old.path);
  if (!next) throw new Error('A publicação não pode remover arquivos.');
  const hashes = new Set([next.sha256, ...(next.versions || []).map(v => v.sha256)]);
  if (![old.sha256, ...(old.versions || []).map(v => v.sha256)].every(hash => hashes.has(hash))) throw new Error('A publicação não pode remover versões anteriores.');
}
const objects = new Map();
for (const file of incoming.files) {
  if (!/^(Planilhas|Evidencias)\//.test(file.path) || file.path.includes('..')) throw new Error('Caminho inesperado.');
  for (const object of [file, ...(file.versions || [])]) {
    objectKey(object.sha256);
    if (!Number.isSafeInteger(object.size) || object.size <= 0) throw new Error('Tamanho inválido.');
    objects.set(object.sha256, { ...object, mime: file.mime, extension: path.extname(file.path) });
  }
}
let uploaded = 0, checked = 0;
const queue = [...objects.values()];
async function worker() {
  for (;;) {
    const file = queue.shift();
    if (!file) return;
    const key = objectKey(file.sha256);
    let existing;
    try { existing = await head(key); }
    catch (error) { if (!(error instanceof BlobNotFoundError)) throw error; }
    if (!existing) {
      let bytes;
      for (const folder of sources) {
        try { bytes = await fs.readFile(path.join(folder, file.sha256 + file.extension)); break; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      if (!bytes || bytes.length !== file.size || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Arquivo local ausente ou divergente: ' + file.sha256);
      await put(key, bytes, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: file.mime, cacheControlMaxAge: 31536000 });
      uploaded++;
    } else if (existing.size !== file.size) throw new Error('Tamanho divergente no Blob.');
    const downloaded = await get(key, { access: 'private' });
    if (downloaded?.statusCode !== 200) throw new Error('Falha de leitura após envio.');
    const bytes = new Uint8Array(await new Response(downloaded.stream).arrayBuffer());
    if (bytes.length !== file.size || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Hash divergente no Blob.');
    checked++;
    if (checked % 20 === 0 || checked === objects.size) console.log(JSON.stringify({ checked, total: objects.size, uploaded }));
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const catalog = { ...incoming, revision: randomUUID(), baseRevision: current?.value.revision || null, updatedAt: new Date().toISOString() };
const body = JSON.stringify(catalog);
await put(`portal/catalogs/${catalog.revision}.json`, body, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', cacheControlMaxAge: 31536000 });
await put(CATALOG_KEY, body, { access: 'private', addRandomSuffix: false, allowOverwrite: !!current, ...(current ? { ifMatch: current.etag } : {}), contentType: 'application/json', cacheControlMaxAge: 60 });
const published = await readCatalog();
if (published.value.revision !== catalog.revision || JSON.stringify(published.value.files) !== JSON.stringify(catalog.files)) throw new Error('Falha na conferência da publicação.');
const result = { status: 'published', revision: catalog.revision, files: catalog.files.length, evidence: catalog.files.filter(file => file.mime === 'image/png').length, uploaded, checked, updatedAt: catalog.updatedAt };
await fs.writeFile(path.join(sources[0], '..', 'publicacao-vercel.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
