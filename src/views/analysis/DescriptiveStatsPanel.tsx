import { useEffect, useMemo, useState, type FC } from 'react';
import tauriIPC from '../../bridge';
import type { ParsedTable } from '../../components/DataTable';
import VariableSelector from '../../components/VariableSelector';
import ExecuteButton from '../../components/ExecuteButton';
import DesciriptiveOption, { type DescriptiveOrder } from '../../components/DesciriptiveOption';

type Props = {
  path: string;
  sheet: string;
  onConfirm: (selectedVariables: string[], order: DescriptiveOrder) => void;
};

const DescriptiveStatsPanel: FC<Props> = ({ path, sheet, onConfirm }) => {
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => table?.headers ?? [], [table]);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<DescriptiveOrder>('default');

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

  return (
    <section className="desc-panel-abs">
      {loading && <p>読み込み中…</p>}
      {error && <p className="error">エラー: {error}</p>}
      {!loading && !error && (
        <>
          <div className="desc-content">
            <div className="desc-varsel-abs">
              <VariableSelector allVariables={headers} value={selected} onChange={applySelection} />
            </div>
            <div className="desc-order-abs">
              <DesciriptiveOption value={order} onChange={setOrder} />
            </div>
          </div>

          <div className="table-view-controls" style={{ justifyContent: 'flex-end' }}>
            <ExecuteButton onClick={() => onConfirm(selected, order)} disabled={selected.length === 0} />
          </div>
        </>
      )}
    </section>
  );
};

export default DescriptiveStatsPanel;
