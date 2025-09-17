import { invoke } from '@tauri-apps/api/core';
import { type ParsedTable } from './components/DataTable';

class TauriIPC {
  async listSheets(path: string): Promise<string[]> {
    return await invoke('list_sheets', { path });
  }

  async parseExcel(path: string, sheet: string): Promise<ParsedTable> {
    return await invoke('parse_excel', { path, sheet });
  }

  async openOrReuseWindow(label: string, url: string, payload?: Record<string, unknown>): Promise<void> {
    return await invoke('open_or_reuse_window', {
      label,
      url,
      payload,
    });
  }

  async runDescriptiveStats(path: string, sheet: string, variables: string[]): Promise<ParsedTable> {
    return await invoke('run_descriptive_stats', { path, sheet, variables });
  }
}

const tauriIPC = new TauriIPC();
export default tauriIPC;
