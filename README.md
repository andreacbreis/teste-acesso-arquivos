# Consulta PAFs · SEFAZ Bahia

Portal público de consulta e download em https://consulta-sefaz-braskem.vercel.app. O projeto Vercel é `consulta-sefaz-braskem`. O endereço anterior `teste-acesso-arquivos.vercel.app` permanece compatível para os links já compartilhados; o repositório e a pasta local conservam o nome anterior.

O frontend React conserva o visual azul da Braskem, a navegação mensal, a busca por ID/PAF, a prévia de prints, o ZIP mensal e o histórico de versões. A identidade visual está documentada em `DESIGN.md`.

## Arquitetura

- O frontend é gerado em `dist/` por `npm run build`.
- `api/portal.mjs` atende `/api/catalog` e `/files/<caminho>` pela Vercel, lendo o Blob privado. Downloads, prévias e versões passam pelo domínio do portal. Não há endpoint público de escrita.
- `portal/objects/<sha256>` contém objetos imutáveis. `portal/catalogs/<revisão>.json` preserva cada publicação e `portal/catalog.json` contém o acervo vigente.
- Os arquivos e o catálogo reais ficam no Blob e no pacote local de trabalho, fora deste repositório público. Credenciais, builds e arquivos de trabalho são ignorados pelo Git.

## Publicação mensal

O manual canônico está em `/Volumes/devandrea/braskem/processo-mensal-sefaz-ba.md` e na aba `INSTRUCOES` da planilha. Ele define a preparação do Excel e dos prints, a verificação da cópia e a criação do pacote.

Renovar as credenciais locais com `npx --yes vercel@64.4.0 env pull .env.local --yes --environment development --scope andreas-projects-cde5ae1f` e executar `node --env-file=.env.local scripts/publish-portal.mjs <pasta-do-pacote> [pasta-com-versões-anteriores]`.

O publicador preserva caminhos e versões anteriores, envia somente objetos ausentes e relê cada objeto para conferir tamanho e SHA-256. Só então troca o catálogo, com condição de ETag para evitar sobrescrever uma publicação concorrente. Para essa condição, usa o ETag forte de `head`, conferido contra o ETag da leitura do catálogo; uma leitura comprimida pode fornecer um ETag fraco que não é aceito na escrita. O parâmetro `--initialize` é reservado à primeira migração. Atualizações do acervo não exigem novo deploy de código.

O projeto é `prj_OY6cTko1mUBIpAM3MFNeTUinRt7D`, equipe `andreas-projects-cde5ae1f`, Blob privado `store_urvdgYBxgwU9AdUz`.

## Testes anteriores

As páginas antigas do GitHub Pages encaminham para o portal real na Vercel. Na Vercel, `/blob.html` redireciona para a página inicial e os antigos caminhos `/downloads/` e `/arquivos/exemplo/` encaminham para o Excel, um print real ou o ZIP do mês mais recente. Os arquivos fictícios foram retirados do código publicado.
