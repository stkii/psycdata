import { invoke } from '@tauri-apps/api/core';
import { type ParsedTable } from './components/DataTable';

class TauriIPC {
  async listSheets(path: string): Promise<string[]> {
    return await invoke('list_sheets', { path });
  }

  async parseExcel(path: string, sheet: string): Promise<ParsedTable> {
    return await invoke('parse_excel', { path, sheet });
  }

  // 汎用：ウィンドウを開く/再利用（Rust 側でタイトル・サイズ・イベントなどをラベルに応じて決定）
  async openOrReuseWindow(
    label: string,
    url: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    return await invoke('open_or_reuse_window', {
      label,
      url,
      payload,
    });
  }
}

const tauriIPC = new TauriIPC();
export default tauriIPC;
