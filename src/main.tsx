import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Portal from './portal';
import type { Catalog } from './types';

function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/catalog', { cache: 'no-store', signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Catálogo indisponível');
        const data = await response.json();
        if (data.version !== 1 || !Array.isArray(data.files)) throw new Error('Catálogo inválido');
        setCatalog(data);
      })
      .catch(error => { if (error.name !== 'AbortError') setError(true); });
    return () => abort.abort();
  }, []);
  if (catalog) return <Portal initialCatalog={catalog} />;
  return <main className="loading-panel" role="status"><h1>Consulta PAFs</h1><p>{error ? 'Não foi possível carregar os arquivos.' : 'Carregando planilhas e evidências…'}</p>{error && <button className="primary-button" onClick={() => location.reload()}>Tentar novamente</button>}</main>;
}

createRoot(document.getElementById('root')!).render(<App />);
