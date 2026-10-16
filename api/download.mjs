import { get } from '@vercel/blob';
import { readFile } from 'node:fs/promises';

// Only these explicitly published examples may be downloaded by anonymous visitors.
// The store remains private and there is no public upload endpoint.
const manifest = JSON.parse(await readFile(new URL('../config/blob-files.json', import.meta.url), 'utf8'));

export async function GET(request) {
  const name = new URL(request.url).searchParams.get('file');
  const file = manifest.files.find(item => item.name === name);
  if (!file) return new Response('Arquivo não encontrado.', { status: 404 });

  try {
    const result = await get(file.pathname, { access: 'private' });
    if (result?.statusCode !== 200) {
      return new Response('Arquivo indisponível.', { status: 404 });
    }
    // Forward the stream, including ZIPs larger than the buffered response limit.
    return new Response(result.stream, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Storage-Source': 'vercel-blob-private',
        'X-Content-SHA256': file.sha256,
        'Cache-Control': 'public, max-age=0, s-maxage=60',
      },
    });
  } catch (error) {
    console.error('Blob download failed', { file: file.name, error: error.name });
    return new Response('Não foi possível baixar o arquivo. Tente novamente.', { status: 503 });
  }
}
