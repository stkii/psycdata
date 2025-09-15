import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import tauriIPC from '../../bridge';
import DataTable, { type ParsedTable } from '../../components/DataTable';
import AnalysisMenuButton from '../../components/AnalysisMenuButton';

const TableView = () => {
  const [error, setError] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[] | null>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  async function pickFile() {
    try {
      setError(null);
      setLoading(true);

      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      });

      if (!selected) return;
      const path = Array.isArray(selected) ? selected[0] : selected;
      setFilePath(path);
      setSheetNames(null);
      setSelectedSheet('');

      const names = await tauriIPC.listSheets(path);
      setSheetNames(names);
    } catch (error) {
      setTable(null);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  // 選択中のシートをパースして表データを取得
  async function loadSelectedSheet() {
    if (!filePath || !selectedSheet) return;
    try {
      setError(null);
      setLoading(true);
      const result = await tauriIPC.parseExcel(filePath, selectedSheet);
      setTable(result);
    } catch (e) {
      setTable(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // 選択状態と読み込み結果を初期化
  function clearData() {
    setTable(null);
    setFilePath(null);
    setSheetNames(null);
    setSelectedSheet('');
    setError(null);
  }

  return (
    <main className="table-view-container">
      <h1>データビューア（開発中）</h1>

      <div className="table-view-controls">
        <button onClick={pickFile} disabled={loading}>
          {filePath ? '別のファイルを選択' : 'ファイルを選択'}
        </button>
        {filePath && sheetNames && (
          <>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.currentTarget.value)}
              disabled={loading}
            >
              <option value="" disabled>
                シートを選択
              </option>
              {sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button onClick={loadSelectedSheet} disabled={!selectedSheet || loading}>
              読み込む
            </button>
            <AnalysisMenuButton
              disabled={!selectedSheet || loading}
              filePath={filePath}
              sheet={selectedSheet}
            />
          </>
        )}
        {(filePath || table) && (
          <button onClick={clearData} disabled={loading}>
            クリア
          </button>
        )}
      </div>

      {filePath && <p className="muted small">選択中のファイル: {filePath}</p>}

      {loading && <p>読み込み中…</p>}
      {error && <p className="error">読み込みに失敗しました: {error}</p>}

      {table && (
        <section>
          <DataTable data={table} />
        </section>
      )}
    </main>
  );
};

export default TableView;
