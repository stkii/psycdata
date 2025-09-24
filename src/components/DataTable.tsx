import { useMemo, type FC } from 'react';

export type CellValue = string | number | boolean | null | undefined;

/*
 * Rust側のDTOとあわせる
 */
export type ParsedTable = {
  headers: string[];
  rows: CellValue[][];
};

type Props = {
  data: ParsedTable;
  className?: string;
};

/*
 * データが存在していない場合、または欠損値を置換する関数
 *   - NULL：もともと値が存在していないことを示す
 *   - NA：本来なら存在するはずの値が何らかの理由で存在しない状態を示す
 */
function formatMissingCell(value: CellValue): string {
  if (value === null) return 'NULL';
  if (value === undefined) return 'NA';
  return String(value);
}

const DataTable: FC<Props> = ({ data, className }) => {
  const { headers, rows } = data;

  const colCount = useMemo(() => {
    const maxRowLength = rows.reduce((max, row) => Math.max(max, row.length), 0);
    return Math.max(headers.length, maxRowLength);
  }, [headers, rows]);
  const displayHeaders = useMemo(() => {
    return Array.from({ length: colCount }, (_, i) => headers[i] ?? `列${i + 1}`); // 不足しているヘッダーは自動生成
  }, [headers, colCount]);

  return (
    <div className={`table-wrap ${className ?? ''}`.trim()}>
      <table className="data-table">
        <thead>
          <tr>
            <th className="rownum" key="rownum">
              {/* 行番号列のヘッダー（空欄）*/}
            </th>
            {displayHeaders.map((h, idx) => (
              <th key={idx} title={h}>
                {h} {/* データ列のヘッダーを表示 */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={displayHeaders.length + 1} className="muted">
                データがありません {/* 空のテーブルメッセージ */}
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="rownum" key="rownum">
                  {rIdx + 1} {/* 行番号を表示 */}
                </td>
                {Array.from({ length: colCount }, (_, cIdx) => {
                  const val = formatMissingCell(row[cIdx]); // 欠損値の置換
                  return <td key={cIdx}>{val}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
