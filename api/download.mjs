import { readCatalog } from '../lib/catalog.mjs';

// Preserve previously shared download URLs while serving the current real archive.
const legacyNames = new Map([
  ['planilha-teste.xlsx', 'xlsx'],
  ['imagem-teste.png', 'png'],
  ['pacote-teste.zip', 'zip'],
  ['pacote-teste-10mb.zip', 'zip'],
]);

export async function GET(request) {
  const name = new URL(request.url).searchParams.get('file');
  const type = legacyNames.get(name);
  if (!type) return new Response('Arquivo não encontrado.', { status: 404 });

  try {
    const { value: catalog } = await readCatalog();
    const months = catalog.files.map(file => /^Evidencias\/((?:0[1-9]|1[0-2])\d{4})\//.exec(file.path)?.[1]).filter(Boolean);
    const latestMonth = months.sort((a, b) => (a.slice(2) + a.slice(0, 2)).localeCompare(b.slice(2) + b.slice(0, 2))).at(-1);
    const file = type === 'xlsx'
      ? catalog.files.find(item => item.path === 'Planilhas/Consulta SEFAZ BA.xlsx')
      : catalog.files.find(item => item.path.startsWith(`Evidencias/${latestMonth}/`) && item.path.endsWith(`.${type}`));
    if (!file) return new Response('Arquivo indisponível.', { status: 404 });
    return new Response(null, {
      status: 307,
      headers: {
        Location: `/files/${file.path.split('/').map(encodeURIComponent).join('/')}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('Legacy download redirect failed', { file: name, error: error?.name });
    return new Response('Não foi possível baixar o arquivo. Tente novamente.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export const HEAD = GET;
