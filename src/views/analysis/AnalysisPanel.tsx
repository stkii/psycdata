import { useEffect, useMemo } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import tauriIPC from '../../bridge';
import DescriptiveStatsPanel from './DescriptiveStatsPanel';
import CorrelationPanel from './CorrelationPanel';
import FactorAnalysisPanel from './FactorAnalysisPanel';
import ExecuteButton from '../../components/ExecuteButton';

const AnalysisPanel = () => {
  const query = useMemo(() => new URLSearchParams(window.location.search || ''), []);
  const type = query.get('analysis') || query.get('type') || '';
  const path = query.get('path') || '';
  const sheet = query.get('sheet') || '';

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | null = null;
    (async () => {
      unlisten = await win.listen('panel:load', (_ev: any) => {
        // 既存ウィンドウ再利用時の初期化処理はここに書く
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const runAnalysis = async () => {
    const payload: Record<string, unknown> = { path, sheet, analysis: type };
    const url = `src-tauri/assets/html/result.html?path=${encodeURIComponent(
      path
    )}&sheet=${encodeURIComponent(sheet)}&analysis=${encodeURIComponent(type)}`;

    await tauriIPC.openOrReuseWindow('result', url, payload);

    const win = getCurrentWebviewWindow();
    await win.close();
  };

  const cancel = () => {
    const win = getCurrentWebviewWindow();
    win.close();
  };

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
      ) : type === 'factor' ? (
        <FactorAnalysisPanel />
      ) : (
        <section>
          <p className="muted">この分析タイプの設定UIはMVPで未実装です。</p>
        </section>
      )}
      {type !== 'descriptive' && type !== 'correlation' && (
        <div className="table-view-controls" style={{ justifyContent: 'flex-end' }}>
          <ExecuteButton onClick={runAnalysis} disabled={!type || !path || !sheet} />
        </div>
      )}
    </main>
  );
};

export default AnalysisPanel;
