import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import DataTable, { type ParsedTable } from '../../components/DataTable';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
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
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
            } catch (_) {
              // ignore parse error; will fall back
            }
          }
          if (vars.length > 0) {
            const result = await tauriIPC.runDescriptiveStats(path, sheet, vars);
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
            } catch (_) {
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
      }>(
        'result:load',
        async (ev) => {
          const p = ev.payload?.path;
          const s = ev.payload?.sheet;
          if (!p || !s) return;
          try {
            setLoading(true);
            setError(null);
            if (ev.payload?.analysis === 'descriptive' && Array.isArray(ev.payload?.variables)) {
              const result = await tauriIPC.runDescriptiveStats(p, s, ev.payload.variables);
              setTable(result as unknown as ParsedTable);
            } else if (ev.payload?.analysis === 'correlation' && Array.isArray(ev.payload?.variables)) {
              const result = await tauriIPC.runCorrelation(p, s, ev.payload.variables);
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
        }
      );
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
      {loading && <p>読み込み中…</p>}
      {error && <p className="error">エラー: {error}</p>}
      {table && (
        <section>
          <p className="muted">
            {table.rows.length} 行 * {Math.max(table.headers.length, ...table.rows.map((r) => r.length))} 列
          </p>
          <DataTable data={table} />
        </section>
      )}
      {!loading && !error && !table && <p className="muted">パラメータが不足しています。</p>}
    </main>
  );
}
