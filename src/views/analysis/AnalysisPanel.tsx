import { useEffect, useMemo } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import tauriIPC from '../../bridge';
import DescriptiveStatsPanel from './DescriptiveStatsPanel';
import CorrelationPanel from './CorrelationPanel';
import ReliabilityPanel from './ReliabilityPanel';
import FactorAnalysisPanel from './FactorAnalysisPanel';

const AnalysisPanel = () => {
  const query = useMemo(() => new URLSearchParams(window.location.search || ''), []);
  const type = query.get('analysis') || query.get('type') || '';
  const path = query.get('path') || '';
  const sheet = query.get('sheet') || '';

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | null = null;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      unlisten = await win.listen('panel:load', (_ev: unknown) => {
        // 既存ウィンドウ再利用時の初期化処理はここに書く
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // No parent-level execute button; each panel handles execution.

  return (
    <main className="container analysis-panel-root">
      <h1>分析パネル</h1>
      <p className="muted small analysis-panel-subtitle">
        分析: {type} / シート: {sheet}
      </p>
      {type === 'descriptive' ? (
        <DescriptiveStatsPanel
          path={path}
          sheet={sheet}
          onConfirm={async (selected, order) => {
            const payload: Record<string, unknown> = {
              path,
              sheet,
              analysis: 'descriptive',
              variables: selected,
              sort: order,
            };
            const url = `src-tauri/assets/html/result.html?path=${encodeURIComponent(
              path
            )}&sheet=${encodeURIComponent(sheet)}&analysis=${encodeURIComponent('descriptive')}&sort=${encodeURIComponent(
              order
            )}&vars=${encodeURIComponent(JSON.stringify(selected))}`;
            await tauriIPC.openOrReuseWindow('result', url, payload);
            const win = getCurrentWebviewWindow();
            await win.close();
          }}
        />
      ) : type === 'correlation' ? (
        <CorrelationPanel
          path={path}
          sheet={sheet}
          onConfirm={async (selected) => {
            const payload: Record<string, unknown> = {
              path,
              sheet,
              analysis: 'correlation',
              variables: selected,
            };
            const url = `src-tauri/assets/html/result.html?path=${encodeURIComponent(
              path
            )}&sheet=${encodeURIComponent(sheet)}&analysis=${encodeURIComponent('correlation')}&vars=${encodeURIComponent(
              JSON.stringify(selected)
            )}`;
            await tauriIPC.openOrReuseWindow('result', url, payload);
            const win = getCurrentWebviewWindow();
            await win.close();
          }}
        />
      ) : type === 'reliability' ? (
        <ReliabilityPanel
          path={path}
          sheet={sheet}
          onConfirm={async (selected, model) => {
            const payload: Record<string, unknown> = {
              path,
              sheet,
              analysis: 'reliability',
              variables: selected,
              model,
            };
            const url = `src-tauri/assets/html/result.html?path=${encodeURIComponent(
              path
            )}&sheet=${encodeURIComponent(sheet)}&analysis=${encodeURIComponent('reliability')}&model=${encodeURIComponent(
              model
            )}&vars=${encodeURIComponent(JSON.stringify(selected))}`;
            await tauriIPC.openOrReuseWindow('result', url, payload);
            const win = getCurrentWebviewWindow();
            await win.close();
          }}
        />
      ) : type === 'factor' ? (
        <FactorAnalysisPanel />
      ) : (
        <section>
          <p className="muted">この分析タイプの設定UIはMVPで未実装です。</p>
        </section>
      )}
    </main>
  );
};

export default AnalysisPanel;
