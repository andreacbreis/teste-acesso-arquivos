export type PortalFile = { path: string; sha256: string; size: number; mime: string; updatedAt: string; id?: string; paf?: string; status?: string; sourceDate?: string; versions?: { sha256: string; size: number; updatedAt: string }[] };
export type Catalog = { version: 1; revision: string; baseRevision?: string | null; updatedAt: string | null; source: string; files: PortalFile[] };
export function fileURL(path: string) { return "/files/" + path.split("/").map(encodeURIComponent).join("/"); }
