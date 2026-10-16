"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Folder, FolderOpen, FileImage, Search, ChevronRight, ArrowLeft, ArrowUpRight, RefreshCw, X, Archive, CalendarDays } from "lucide-react";
import { fileURL, type Catalog, type PortalFile } from "./types";
const names = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function monthName(m: string) { return /^(0[1-9]|1[0-2])\d{4}$/.test(m) ? `${names[Number(m.slice(0,2)) - 1]} de ${m.slice(2)}` : m; }
function sizeLabel(size: number) { return size >= 1024 ** 2 ? (size / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB"; }
function dateLabel(s: string | null) { return s ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" }).format(new Date(s)) : "Aguardando a primeira atualização"; }
function Icon({ file }: { file: PortalFile }) { return file.mime === "image/png" ? <FileImage size={20} /> : file.path.endsWith(".zip") ? <Archive size={20} /> : <FileSpreadsheet size={20} />; }
export default function Portal({ initialCatalog }: { initialCatalog: Catalog }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [path, setPath] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState<PortalFile | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const months = useMemo(() => [...new Set(catalog.files.filter(f => f.mime === "image/png").map(f => f.path.split("/")[1]))].sort((a,b) => (b.slice(2) + b.slice(0,2)).localeCompare(a.slice(2) + a.slice(0,2))), [catalog]);
  const latest = months[0];
  const excel = catalog.files.find(f => f.path === "Planilhas/Consulta SEFAZ BA.xlsx");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const matching = catalog.files.filter(f => f.path.startsWith(path ? path + "/" : "") && (!normalizedQuery || (f.path + " " + (f.status || "")).toLocaleLowerCase("pt-BR").includes(normalizedQuery)));
  const folders = normalizedQuery ? [] : [...new Set(matching.map(f => f.path.slice(path ? path.length + 1 : 0).split("/")).filter(a => a.length > 1).map(a => a[0]))].sort((a,b) => b.localeCompare(a));
  const files = matching.filter(f => normalizedQuery || !f.path.slice(path ? path.length + 1 : 0).includes("/")).sort((a,b) => a.path.localeCompare(b.path, "pt-BR", { numeric: true }));
  const month = path.split("/")[1];
  const zip = catalog.files.find(f => f.path === `Evidencias/${month}/Evidencias-${month}.zip`);
  const screenshotCount = catalog.files.filter(f => f.mime === "image/png").length;
  async function refresh() {
    setRefreshing(true); setError("");
    try { const r = await fetch("/api/catalog", { cache: "no-store" }); if (!r.ok) throw new Error(); setCatalog(await r.json()); }
    catch { setError("Não foi possível conferir a atualização. Os arquivos abaixo pertencem à última edição carregada. Tente novamente."); }
    finally { setRefreshing(false); }
  }
  function navigate(next: string) { setPath(next); setQuery(""); }
  useEffect(() => { if (preview && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [preview]);
  return <div className="portal-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Consulta PAFs · início"><img className="brand-logo" src="/brand/braskem.webp" alt="Braskem" width="170" height="52" /><span>Consulta PAFs<small>SEFAZ Bahia</small></span></a>
      <p className="nav-caption">ARQUIVO DE CONSULTAS</p>
      <button className={path === "" ? "nav-item active" : "nav-item"} onClick={() => navigate("")}><FolderOpen size={18} />Todos os arquivos</button>
      <button className={path === "Planilhas" ? "nav-item active" : "nav-item"} onClick={() => navigate("Planilhas")}><FileSpreadsheet size={18} />Planilhas Excel</button>
      <p className="nav-caption months-caption">EVIDÊNCIAS POR MÊS</p>
      <nav aria-label="Meses das evidências">{months.map(m => <button key={m} className={path === `Evidencias/${m}` ? "nav-item active month" : "nav-item month"} onClick={() => navigate(`Evidencias/${m}`)}><CalendarDays size={18} /><span>{monthName(m)}</span><small>{catalog.files.filter(f => f.mime === "image/png" && f.path.startsWith(`Evidencias/${m}/`)).length}</small></button>)}</nav>
      <div className="sidebar-note"><span className="dot" /><div>Downloads diretos<p>Planilha e prints disponíveis neste portal.</p></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span>Documentos e evidências</span><span className="source-label">Consultas à SEFAZ BA</span></header>
      <main className="content">
        <div className="heading-row"><div><h1>Planilhas e evidências</h1><p className="intro">Consulte os arquivos por mês e baixe o que precisar.</p></div><button className="icon-button refresh" onClick={refresh} disabled={refreshing} aria-label="Conferir atualizações"><RefreshCw size={18} className={refreshing ? "spinning" : ""} /></button></div>
        <div className="update-line"><span className="dot" /><span>Última atualização: <strong>{dateLabel(catalog.updatedAt)}</strong> <span className="bahia">· horário da Bahia</span></span></div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <section className="download-strip" aria-label="Downloads principais"><div className="excel-symbol"><FileSpreadsheet size={30} strokeWidth={1.5} /></div><div className="download-description"><h2>Consulta SEFAZ BA</h2><p>Todas as abas em um arquivo Excel. Evidências com links para este portal.</p></div>{excel ? <a className="primary-button" href={fileURL(excel.path)} download><Download size={17} />Baixar Excel <span>.xlsx</span></a> : <span className="muted">Em preparação</span>}</section>
        <div className="library-header"><div><h2>Arquivos disponíveis</h2><p>{screenshotCount.toLocaleString("pt-BR")} evidências em {months.length} {months.length === 1 ? "mês" : "meses"}</p></div>{latest && path === "" && <button className="text-button" onClick={() => navigate(`Evidencias/${latest}`)}>Abrir mês mais recente<ArrowUpRight size={16} /></button>}</div>
        <section className="library">
          <div className="library-toolbar"><nav className="breadcrumbs" aria-label="Pasta atual"><button onClick={() => navigate("")}>Arquivos</button>{path.split("/").filter(Boolean).map((part,i,a) => <span key={i}><ChevronRight size={14} /><button onClick={() => navigate(a.slice(0,i+1).join("/"))}>{part}</button></span>)}</nav><label className="search"><Search size={17} /><input aria-label="Buscar ID ou número do PAF" placeholder="Buscar ID ou número do PAF" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
          {month && <div className="month-bar"><div><FolderOpen size={18} /><span>{monthName(month)}</span></div>{zip && <a href={fileURL(zip.path)} download><Archive size={16} />Baixar mês completo (.zip)</a>}</div>}
          <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Nome do arquivo</th><th>Situação</th><th>Tamanho</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
            {path && !normalizedQuery && <tr><td colSpan={4}><button className="back-row" onClick={() => navigate(path.split("/").slice(0,-1).join("/"))}><ArrowLeft size={17} />Voltar uma pasta</button></td></tr>}
            {folders.map(folder => { const next = path ? path + "/" + folder : folder; const n = catalog.files.filter(f => f.path.startsWith(next + "/") && f.mime === "image/png").length; return <tr key={folder} className="folder-row"><td><button className="file-name" onClick={() => navigate(next)}><span className="file-icon folder-icon"><Folder size={21} /></span><span>{folder}<small>{/^(0[1-9]|1[0-2])\d{4}$/.test(folder) ? monthName(folder) : folder === "Evidencias" ? "Prints organizados por mês" : "Arquivos para download"}</small></span></button></td><td className="muted">Pasta</td><td className="muted">{n ? `${n} prints` : ""}</td><td><button className="icon-button" aria-label={`Abrir pasta ${folder}`} onClick={() => navigate(next)}><ChevronRight size={18} /></button></td></tr>; })}
            {files.map(file => <tr key={file.path}><td><button className="file-name" onClick={() => file.mime === "image/png" ? setPreview(file) : window.location.assign(fileURL(file.path))}><span className={`file-icon ${file.path.endsWith(".xlsx") ? "sheet-icon" : ""}`}><Icon file={file} /></span><span>{file.path.split("/").pop()}{normalizedQuery && <small>{file.path.split("/").slice(0,-1).join(" / ")}</small>}</span></button></td><td>{file.status ? <span className={`status ${file.status === "Em Aberto" ? "open" : ""}`}>{file.status}</span> : <span className="muted">{file.path.endsWith(".zip") ? "Pasta completa" : file.path.endsWith(".xlsx") ? "Excel" : ""}</span>}</td><td className="file-size">{sizeLabel(file.size)}</td><td><a className="icon-button" href={fileURL(file.path)} download aria-label={`Baixar ${file.path.split("/").pop()}`}><Download size={18} /></a></td></tr>)}
          </tbody></table></div>
          {!folders.length && !files.length && <div className="empty"><Search size={26} /><h3>{normalizedQuery ? "Nenhum arquivo encontrado" : "Arquivos em preparação"}</h3><p>{normalizedQuery ? "Tente outro ID, número do PAF ou nome de arquivo." : "A primeira edição será exibida aqui após o envio e a conferência dos arquivos."}</p></div>}
          <div className="library-footer"><span>{folders.length} {folders.length === 1 ? "pasta" : "pastas"} · {files.length} {files.length === 1 ? "arquivo" : "arquivos"}</span><span>Atualizado após cada execução ou correção</span></div>
        </section>
        <footer className="page-footer"><span>Consulta PAFs · SEFAZ Bahia</span><span>Os valores refletem a data indicada em cada consulta.</span></footer>
      </main>
    </div>
    <dialog ref={dialog} className="preview-dialog" onClose={() => setPreview(null)}>{preview && <><div className="preview-header"><div><strong>{preview.path.split("/").pop()}</strong><small>{preview.status}{preview.sourceDate ? ` · Valores atualizados até ${preview.sourceDate}` : ""}</small></div><a className="text-button" href={fileURL(preview.path)} download><Download size={17} />Baixar print</a><button className="icon-button" aria-label="Fechar visualização" onClick={() => dialog.current?.close()}><X size={21} /></button></div><div className="preview-image"><img src={fileURL(preview.path) + "?inline=1"} alt={`Detalhamento do PAF ${preview.paf || ""}`} /></div>{!!preview.versions?.length && <details className="versions"><summary>Versões anteriores ({preview.versions.length})</summary>{preview.versions.map(v => <a key={v.sha256} href={fileURL(preview.path) + "?version=" + v.sha256} download>{dateLabel(v.updatedAt)} · baixar versão anterior</a>)}</details>}</>}</dialog>
  </div>;
}
