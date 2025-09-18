import { useEffect, useMemo, useState, type ChangeEvent, type FC } from 'react';
import tauriIPC from '../../bridge';
import type { ParsedTable } from '../../components/DataTable';
import VariableSelector from '../../components/VariableSelector';
import ExecuteButton from '../../components/ExecuteButton';

type Props = {
  path: string;
  sheet: string;
  onConfirm: (selectedVariables: string[]) => void;
};

const CorrelationPanel: FC<Props> = ({ path, sheet, onConfirm }) => {
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => table?.headers ?? [], [table]);
  const [selected, setSelected] = useState<string[]>([]);
  // 相関係数の選択（複数チェック可）
  const [methods, setMethods] = useState<{ pearson: boolean; kendall: boolean; spearman: boolean}>(
    { pearson: true, kendall: false, spearman: false }
  );
  // 検定（両側/片側）
  const [alt, setAlt] = useState<'two.sided' | 'one.sided'>('two.sided');

  useEffect(() => {
    if (!path || !sheet) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await tauriIPC.parseExcel(path, sheet);
        if (!cancelled) setTable(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, sheet]);

  const applySelection = (next: string[]) => {
    setSelected(next);
  };

  const toggleMethod = (key: 'pearson' | 'kendall' | 'spearman') => (e: ChangeEvent<HTMLInputElement>) => {
    const checked = (e.target as HTMLInputElement).checked;
    setMethods((cur) => ({ ...cur, [key]: checked }));
  };

  const changeAlt = (val: 'two.sided' | 'one.sided') => () => setAlt(val);

  return (
    <section className="generic-panel-abs">
      {loading && <p>読み込み中…</p>}
      {error && <p className="error">エラー: {error}</p>}
      {!loading && !error && (
        <>
          <div className="generic-varsel-abs">
            <VariableSelector allVariables={headers} value={selected} onChange={applySelection} />
          </div>
          <div className="corr-side-abs">
            <fieldset className="option-group" style={{ marginBottom: 8 }}>
              <legend>相関係数</legend>
              <label className="radio">
                <input type="checkbox" checked={methods.pearson} onChange={toggleMethod('pearson')} />
                Pearson
              </label>
              <label className="radio">
                <input type="checkbox" checked={methods.kendall} onChange={toggleMethod('kendall')} />
                Kendall
              </label>
              <label className="radio">
                <input type="checkbox" checked={methods.spearman} onChange={toggleMethod('spearman')} />
                Spearman
              </label>
            </fieldset>
            <fieldset className="option-group">
              <legend>検定</legend>
              <label className="radio">
                <input
                  type="radio"
                  name="corr-alt"
                  value="two.sided"
                  checked={alt === 'two.sided'}
                  onChange={changeAlt('two.sided')}
                />
                両側
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="corr-alt"
                  value="one.sided"
                  checked={alt === 'one.sided'}
                  onChange={changeAlt('one.sided')}
                />
                片側
              </label>
            </fieldset>
          </div>

          <div className="table-view-controls" style={{ justifyContent: 'flex-end' }}>
            <ExecuteButton onClick={() => onConfirm(selected)} disabled={selected.length < 2} />
          </div>
        </>
      )}
    </section>
  );
};

export default CorrelationPanel;
