import { useEffect, useMemo, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import tauriIPC from '../../bridge';
import type { ChangeEvent } from 'react';

type FactorParams = {
  extraction: '最尤法' | '主因子法' | '最小二乗法';
  rotation: '回転なし' | 'バリマックス' | 'プロマックス';
  criterion: '固有値>1' | 'スクリープロット' | '指定';
  nFactors?: number;
};

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search || ''), []);
}

export default function AnalysisPanel() {
  const query = useQuery();
  const type = query.get('analysis') || query.get('type') || '';
  const path = query.get('path') || '';
  const sheet = query.get('sheet') || '';

  const [factor, setFactor] = useState<FactorParams>({
    extraction: '最尤法',
    rotation: '回転なし',
    criterion: '固有値>1',
    nFactors: 2,
  });

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

  async function runAnalysis() {
    const payload: Record<string, unknown> = { path, sheet, analysis: type };
    if (type === 'factor') payload.params = factor;
    const url = `src-tauri/assets/html/result.html?path=${encodeURIComponent(
      path
    )}&sheet=${encodeURIComponent(sheet)}&analysis=${encodeURIComponent(type)}`;

    await tauriIPC.openOrReuseWindow('result', url, payload);

    const win = getCurrentWebviewWindow();
    await win.close();
  }

  function cancel() {
    const win = getCurrentWebviewWindow();
    win.close();
  }

  return (
    <main className="container">
      <h1>分析パネル</h1>
      <p className="muted small">
        分析: {type} / シート: {sheet}
      </p>

      {type === 'factor' ? (
        <section>
          <div className="table-view-controls" style={{ justifyContent: 'flex-start' }}>
            <label>
              因子抽出法:
              <select
                value={factor.extraction}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = (e.target as HTMLSelectElement).value as FactorParams['extraction'];
                  setFactor((f) => ({ ...f, extraction: value }));
                }}
              >
                <option>最尤法</option>
                <option>主因子法</option>
                <option>最小二乗法</option>
              </select>
            </label>
            <label>
              回転:
              <select
                value={factor.rotation}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = (e.target as HTMLSelectElement).value as FactorParams['rotation'];
                  setFactor((f) => ({ ...f, rotation: value }));
                }}
              >
                <option>回転なし</option>
                <option>バリマックス</option>
                <option>プロマックス</option>
              </select>
            </label>
            <label>
              因子数の決定基準:
              <select
                value={factor.criterion}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = (e.target as HTMLSelectElement).value as FactorParams['criterion'];
                  setFactor((f) => ({ ...f, criterion: value }));
                }}
              >
                <option>固有値&gt;1</option>
                <option>スクリープロット</option>
                <option>指定</option>
              </select>
            </label>
            {factor.criterion === '指定' && (
              <label>
                因子数:
                <input
                  type="number"
                  min={1}
                  value={factor.nFactors ?? 2}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = (e.target as HTMLInputElement).valueAsNumber;
                    setFactor((f) => ({
                      ...f,
                      nFactors: Number.isFinite(value) ? value : (f.nFactors ?? 2),
                    }));
                  }}
                />
              </label>
            )}
          </div>
        </section>
      ) : (
        <section>
          <p className="muted">この分析タイプの設定UIはMVPで未実装です。</p>
        </section>
      )}

      <div className="table-view-controls" style={{ justifyContent: 'flex-end' }}>
        <button onClick={cancel}>キャンセル</button>
        <button onClick={runAnalysis} disabled={!type || !path || !sheet}>
          実行
        </button>
      </div>
    </main>
  );
}
