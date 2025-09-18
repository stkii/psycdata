import { useEffect, useMemo, useState, type ChangeEvent, type FC } from 'react';
import tauriIPC from '../../bridge';
import type { ParsedTable } from '../../components/DataTable';
import VariableSelector from '../../components/VariableSelector';
import ExecuteButton from '../../components/ExecuteButton';

type Props = {
  path: string;
  sheet: string;
  onConfirm: (selectedVariables: string[], model: 'alpha' | 'omega') => void;
};

const ReliabilityPanel: FC<Props> = ({ path, sheet, onConfirm }) => {
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => table?.headers ?? [], [table]);
  const [selected, setSelected] = useState<string[]>([]);
  const [model, setModel] = useState<'alpha' | 'omega'>('alpha');

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

  const applySelection = (next: string[]) => setSelected(next);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChangeModel = (val: 'alpha' | 'omega') => (_e: ChangeEvent<HTMLInputElement>) => setModel(val);

  return (
    <section className="generic-panel-abs">
      {loading && <p>読み込み中…</p>}
      {error && <p className="error">エラー: {error}</p>}
      {!loading && !error && (
        <>
          <div className="generic-varsel-abs">
            <VariableSelector allVariables={headers} value={selected} onChange={applySelection} />
          </div>
          <div className="reli-side-abs">
            <fieldset className="option-group">
              <legend>モデル選択</legend>
              <label className="radio">
                <input
                  type="radio"
                  name="reli-model"
                  value="alpha"
                  checked={model === 'alpha'}
                  onChange={onChangeModel('alpha')}
                />
                alpha（Cronbach）
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="reli-model"
                  value="omega"
                  checked={model === 'omega'}
                  onChange={onChangeModel('omega')}
                />
                omega（未実装）
              </label>
            </fieldset>
          </div>

          <div className="table-view-controls" style={{ justifyContent: 'flex-end' }}>
            <ExecuteButton onClick={() => onConfirm(selected, model)} disabled={selected.length < 2} />
          </div>
        </>
      )}
    </section>
  );
};

export default ReliabilityPanel;
