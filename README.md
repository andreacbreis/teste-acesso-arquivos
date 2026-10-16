# Teste de acesso a hospedagens

Página e downloads fictícios para testar acesso pela rede de trabalho. Não contém dados reais de processos, credenciais nem integrações com Drive, ChatGPT ou SEFAZ.

O mesmo conteúdo é publicado na Vercel e no GitHub Pages. Os links são relativos para funcionar na raiz da Vercel e na subpasta do GitHub Pages.

## Teste de Vercel Blob

`/blob.html` é o segundo teste, exclusivo da Vercel. Os arquivos ficam em um Blob privado e são transmitidos pela função `api/download.mjs` através de `/downloads/<nome>`, mantendo a origem do site no navegador. O GitHub Pages continua com o teste estático original.

O manifesto `config/blob-files.json` contém somente os exemplos explicitamente publicados. A função não aceita um caminho arbitrário do armazenamento nem possui endpoint de escrita. O ZIP fictício maior permite verificar a transmissão acima de 4,5 MB. O SDK usa as credenciais do projeto, nunca enviadas ao navegador.

Para reenviar os exemplos, use uma credencial local do projeto obtida por `vercel env pull` e execute `node --env-file=.env.local scripts/upload-test-files.mjs <pasta-dos-exemplos>`. O script usa caminhos com SHA-256, evita sobrescrita e pode ser executado novamente sem duplicar objetos. A publicação do código deve ocorrer depois do envio completo e da geração do manifesto.
