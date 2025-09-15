import tauriIPC from '../bridge';
import type { ChangeEvent } from 'react';

type Props = {
  filePath: string | null;
  sheet: string;
  disabled?: boolean;
};

const AnalysisMenuButton = ({ filePath, sheet, disabled }: Props) => {
  const onChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const analysis = e.currentTarget.value;
    if (!analysis) return;
    if (!filePath || !sheet) return;
    const url = `src-tauri/assets/html/panel.html?analysis=${encodeURIComponent(
      analysis
    )}&path=${encodeURIComponent(filePath)}&sheet=${encodeURIComponent(sheet)}`;
    await tauriIPC.openOrReuseWindow('panel', url, { path: filePath, sheet, analysis });
    // reset selection to placeholder
    e.currentTarget.value = '';
  };

  return (
    <label>
      <select className="analysis-select" onChange={onChange} disabled={disabled} defaultValue="">
        <option value="" disabled>
          分析
        </option>
        <option value="descriptive">記述統計</option>
        <option value="correlation">相関</option>
        <option value="regression">回帰</option>
        <option value="factor">因子</option>
        <option value="distance">距離</option>
      </select>
    </label>
  );
};

export default AnalysisMenuButton;
