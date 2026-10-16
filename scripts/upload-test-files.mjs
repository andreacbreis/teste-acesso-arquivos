import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { BlobNotFoundError, head, put } from '@vercel/blob';

const source = process.argv[2];
if (!source) throw new Error('Informe a pasta com os três arquivos fictícios.');
const expected = [
  ['planilha-teste.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['imagem-teste.png', 'image/png'],
  ['pacote-teste-10mb.zip', 'application/zip'],
];
const files = [];
for (const [name, contentType] of expected) {
  const bytes = await fs.readFile(path.join(source, name));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const pathname = `teste/20261016/${sha256}/${name}`;
  let existing;
  try { existing = await head(pathname); }
  catch (error) { if (!(error instanceof BlobNotFoundError)) throw error; }
  if (!existing) {
    await put(pathname, bytes, {
      access: 'private', addRandomSuffix: false, allowOverwrite: false,
      contentType, cacheControlMaxAge: 86400,
    });
  } else if (existing.size !== bytes.length) {
    throw new Error(`Tamanho inesperado no armazenamento: ${name}`);
  }
  files.push({ name, pathname, sha256, size: bytes.length, contentType });
  console.log(JSON.stringify({ uploaded: !existing, name, size: bytes.length }));
}
await fs.mkdir('config', { recursive: true });
await fs.writeFile('config/blob-files.json', JSON.stringify({ version: 1, access: 'private', files }, null, 2) + '\n');
