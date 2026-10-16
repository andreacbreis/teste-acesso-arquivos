import { get } from '@vercel/blob';
import { objectKey, readCatalog } from '../lib/catalog.mjs';

async function serve(request, headOnly = false) {
  const url = new URL(request.url);
  try {
    const { value: catalog } = await readCatalog();
    if (url.searchParams.get('operation') === 'catalog') {
      return Response.json(catalog, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    const path = url.searchParams.get('path');
    const file = catalog.files.find(item => item.path === path);
    if (!file) return new Response('Arquivo não encontrado.', { status: 404 });
    const version = url.searchParams.get('version');
    const selected = version ? [file, ...(file.versions || [])].find(item => item.sha256 === version) : file;
    if (!selected) return new Response('Versão não encontrada.', { status: 404 });
    const inline = url.searchParams.get('inline') === '1' && file.mime === 'image/png';
    const headers = {
      'Content-Type': file.mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.path.split('/').pop())}`,
      'Cache-Control': version ? 'public, max-age=31536000, immutable' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Storage-Source': 'vercel-blob-private',
      'X-Content-SHA256': selected.sha256,
    };
    if (headOnly) return new Response(null, { headers: { ...headers, 'Content-Length': String(selected.size) } });
    const result = await get(objectKey(selected.sha256), { access: 'private' });
    if (result?.statusCode !== 200) return new Response('Arquivo indisponível.', { status: 404 });
    return new Response(result.stream, { headers });
  } catch (error) {
    console.error('Portal read failed', { operation: url.searchParams.get('operation'), error: error?.name });
    return new Response('Não foi possível carregar o arquivo. Tente novamente.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export function GET(request) { return serve(request); }
export function HEAD(request) { return serve(request, true); }
