import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import DataTable, { type ParsedTable } from '../../components/DataTable';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { toCsv, toJson } from '../../utils/export';
import tauriIPC from '../../bridge';

function useQuery() {
  return useMemo(() => {
    // result.html では search を優先。hash パラメータにも後方互換で対応。
    const search = window.location.search || '';
    if (search) return new URLSearchParams(search);
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    return new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : '');
  }, []);
}

export default function ResultView() {
  const query = useQuery();
  const path = query.get('path') || '';
  const sheet = query.get('sheet') || '';
  const analysis = query.get('analysis') || '分析';
  const sort = (query.get('sort') as 'default' | 'mean_asc' | 'mean_desc' | null) || null;
  const model = (query.get('model') as 'alpha' | 'omega' | null) || null;
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const variables: string[] = useMemo(() => {
    const varsParam = query.get('vars');
    if (!varsParam) return [];
    try {
      const arr = JSON.parse(varsParam);
      return Array.isArray(arr) ? (arr.filter((v) => typeof v === 'string') as string[]) : [];
    } catch {
      return [];
    }
  }, [query]);

  const defaultFileBase = useMemo(() => {
    const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
    const a = analysis || 'analysis';
    const s = sheet || 'sheet';
    return `${a}_${s}_${ts}`;
  }, [analysis, sheet]);

  async function handleExportJson() {
    if (!table) return;
    const path = await saveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: `${defaultFileBase}.json`,
      title: 'JSONとして保存',
    });
    if (!path) return;
    const outPath = String(path).toLowerCase().endsWith('.json') ? String(path) : `${String(path)}.json`;
    const content = toJson({
      analysis,
      sheet,
      variables,
      table,
      meta: { source: 'psycdata' },
    });
    await tauriIPC.saveTextFile(outPath, content);
  }

  async function handleExportCsv() {
    if (!table) return;
    const path = await saveDialog({
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      defaultPath: `${defaultFileBase}.csv`,
      title: 'CSVとして保存',
    });
    if (!path) return;
    const outPath = String(path).toLowerCase().endsWith('.csv') ? String(path) : `${String(path)}.csv`;
    const content = toCsv(table, { bom: true, newline: '\\r\\n' });
    await tauriIPC.saveTextFile(outPath, content);
  }

  useEffect(() => {
    if (!path || !sheet) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (analysis === 'descriptive') {
          const varsParam = query.get('vars');
          let vars: string[] = [];
          if (varsParam) {
            try {
              vars = JSON.parse(varsParam);
            } catch {
              // ignore parse error; will fall back
            }
          }
          if (vars.length > 0) {
            const result = await tauriIPC.runDescriptiveStats(path, sheet, vars, sort ?? undefined);
            if (!cancelled) setTable(result as unknown as ParsedTable);
          } else {
            // Fallback: just preview the sheet
            const result = await invoke<ParsedTable>('parse_excel', { path, sheet });
            if (!cancelled) setTable(result);
          }
        } else if (analysis === 'correlation') {
          const varsParam = query.get('vars');
          let vars: string[] = [];
          if (varsParam) {
            try {
              vars = JSON.parse(varsParam);
            } catch {
              // ignore parse error
            }
          }
          if (vars.length > 1) {
            const result = await tauriIPC.runCorrelation(path, sheet, vars);
            if (!cancelled) setTable(result as unknown as ParsedTable);
          } else {
            const result = await invoke<ParsedTable>('parse_excel', { path, sheet });
            if (!cancelled) setTable(result);
          }
        } else if (analysis === 'reliability') {
          const varsParam = query.get('vars');
          let vars: string[] = [];
          if (varsParam) {
            try {
              vars = JSON.parse(varsParam);
            } catch {
              // ignore parse error
            }
          }
          if (vars.length > 1) {
            const result = await tauriIPC.runReliability(
              path,
              sheet,
              vars,
              (model ?? 'alpha') as 'alpha' | 'omega'
            );
            if (!cancelled) setTable(result as unknown as ParsedTable);
          } else {
            const result = await invoke<ParsedTable>('parse_excel', { path, sheet });
            if (!cancelled) setTable(result);
          }
        } else {
          const result = await invoke<ParsedTable>('parse_excel', { path, sheet });
          if (!cancelled) setTable(result);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, sheet, analysis, query]);

  // イベントでの更新（result:load）に対応
  useEffect(() => {
    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | null = null;
    (async () => {
      unlisten = await win.listen<{
        path: string;
        sheet: string;
        analysis?: string;
        variables?: string[];
        sort?: 'default' | 'mean_asc' | 'mean_desc';
        model?: 'alpha' | 'omega';
      }>('result:load', async (ev) => {
        const p = ev.payload?.path;
        const s = ev.payload?.sheet;
        if (!p || !s) return;
        try {
          setLoading(true);
          setError(null);
          if (ev.payload?.analysis === 'descriptive' && Array.isArray(ev.payload?.variables)) {
            const result = await tauriIPC.runDescriptiveStats(p, s, ev.payload.variables, ev.payload?.sort);
            setTable(result as unknown as ParsedTable);
          } else if (ev.payload?.analysis === 'correlation' && Array.isArray(ev.payload?.variables)) {
            const result = await tauriIPC.runCorrelation(p, s, ev.payload.variables);
            setTable(result as unknown as ParsedTable);
          } else if (ev.payload?.analysis === 'reliability' && Array.isArray(ev.payload?.variables)) {
            const result = await tauriIPC.runReliability(
              p,
              s,
              ev.payload.variables,
              ev.payload?.model ?? 'alpha'
            );
            setTable(result as unknown as ParsedTable);
          } else {
            const result = await invoke<ParsedTable>('parse_excel', { path: p, sheet: s });
            setTable(result);
          }
        } catch (e) {
          setTable(null);
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setLoading(false);
        }
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <main className="container">
      <h1>結果ビュー（MVP）</h1>
      <p className="muted small">
        分析: {analysis} / シート: {sheet}
      </p>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <button onClick={handleExportJson} disabled={!table || loading}>
          JSONとして保存
        </button>
        <button onClick={handleExportCsv} disabled={!table || loading}>
          CSVとして保存
        </button>
      </div>
      {loading && <p>読み込み中…</p>}
      {error && <p className="error">エラー: {error}</p>}
      {table ? (
        analysis === 'reliability' ? (
          <section>
            {(() => {
              const first = table.rows && table.rows.length > 0 ? table.rows[0] : null;
              const label = first && first.length > 0 ? String(first[0]) : "Cronbach's alpha";
              const value = first && first.length > 1 ? String(first[1]) : '';
              return <p>{`${label}: ${value}`}</p>;
            })()}
          </section>
        ) : analysis === 'correlation' ? (
          (() => {
            const sepIdx = table.rows.findIndex((r) => String((r && r[0]) ?? '') === 'p-value');
            if (sepIdx > -1) {
              const coef = { headers: table.headers, rows: table.rows.slice(0, sepIdx) } as ParsedTable;
              const pvalRaw = { headers: table.headers, rows: table.rows.slice(sepIdx + 1) } as ParsedTable;
              const pval = {
                headers: pvalRaw.headers,
                rows: pvalRaw.rows.map((row) =>
                  row.map((cell, idx) => {
                    if (idx === 0) return cell; // variable name column
                    if (cell === null || cell === undefined) return cell;
                    const s = String(cell).trim();
                    if (s === '' || s.toUpperCase() === 'NA') return cell;
                    const n = Number(s);
                    if (!Number.isNaN(n) && n < 0.001) return '<.001';
                    return cell;
                  })
                ),
              } as ParsedTable;
              return (
                <section>
                  <p className="muted small">相関係数</p>
                  <p className="muted">
                    {coef.rows.length} 行 * {Math.max(coef.headers.length, ...coef.rows.map((r) => r.length))}{' '}
                    列
                  </p>
                  <DataTable data={coef} />
                  <div style={{ height: 12 }} />
                  <p className="muted small">p値</p>
                  <p className="muted">
                    {pval.rows.length} 行 * {Math.max(pval.headers.length, ...pval.rows.map((r) => r.length))}{' '}
                    列
                  </p>
                  <DataTable data={pval} />
                </section>
              );
            }
            return (
              <section>
                <p className="muted">
                  {table.rows.length} 行 * {Math.max(table.headers.length, ...table.rows.map((r) => r.length))} 列
                </p>
                <DataTable data={table} />
              </section>
            );
          })()
        ) : analysis === 'descriptive' ? (
          <section>
            <p className="muted">
              {table.rows.length} 行 * {Math.max(table.headers.length, ...table.rows.map((r) => r.length))} 列
            </p>
            <DataTable data={table} />
          </section>
        ) : null
      ) : null}
      {!loading && !error && !table && <p className="muted">パラメータが不足しています。</p>}
    </main>
  );
}
