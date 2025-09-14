import { invoke } from '@tauri-apps/api/core';
import { type ParsedTable } from './components/DataTable';

class TauriIPC {
  async listSheets(path: string): Promise<string[]> {
    return await invoke('list_sheets', { path });
  }

  async parseExcel(path: string, sheet: string): Promise<ParsedTable> {
    return await invoke('parse_excel', { path, sheet });
  }

  async openNewWindow(name: string, url: string): Promise<void> {
    return await invoke('open_new_window', { name, url });
  }
}

const tauriIPC = new TauriIPC();
export default tauriIPC;
