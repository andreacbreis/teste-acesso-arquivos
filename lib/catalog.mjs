import { get } from '@vercel/blob';

export const CATALOG_KEY = 'portal/catalog.json';
export function objectKey(sha256) {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Hash inválido');
  return `portal/objects/${sha256}`;
}
export async function readCatalog() {
  const result = await get(CATALOG_KEY, { access: 'private', useCache: false });
  if (result?.statusCode !== 200) throw new Error('Catálogo indisponível');
  const value = await new Response(result.stream).json();
  if (value.version !== 1 || !Array.isArray(value.files)) throw new Error('Catálogo inválido');
  return { value, etag: result.blob.etag };
}
