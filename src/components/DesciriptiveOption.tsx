import { type FC } from 'react';

export type DescriptiveOrder = 'default' | 'mean_asc' | 'mean_desc';

type Props = {
  value: DescriptiveOrder;
  onChange: (next: DescriptiveOrder) => void;
};

// 表示順オプション（記述統計用）
// - ラジオボタンで単一選択
// - 値は 'default' | 'mean_asc' | 'mean_desc'
const DesciriptiveOption: FC<Props> = ({ value, onChange }) => {
  return (
    <fieldset className="option-group">
      <legend>表示順</legend>
      <label className="radio">
        <input
          type="radio"
          name="desc-order"
          value="default"
          checked={value === 'default'}
          onChange={() => onChange('default')}
        />
        変数リスト順（デフォルト）
      </label>
      <label className="radio">
        <input
          type="radio"
          name="desc-order"
          value="mean_asc"
          checked={value === 'mean_asc'}
          onChange={() => onChange('mean_asc')}
        />
        平均値による昇順
      </label>
      <label className="radio">
        <input
          type="radio"
          name="desc-order"
          value="mean_desc"
          checked={value === 'mean_desc'}
          onChange={() => onChange('mean_desc')}
        />
        平均値による降順
      </label>
    </fieldset>
  );
};

export default DesciriptiveOption;

