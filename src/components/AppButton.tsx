import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC, type MouseEventHandler, type ReactNode } from 'react';

type Props = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  label: ReactNode;
  title?: string;
  className?: string;
  // 同一groupのボタンは横幅を揃える（最大幅に合わせる）
  widthGroup?: string;
};

type GroupInfo = { width: number; subs: Set<() => void> };
const groupRegistry: Map<string, GroupInfo> = new Map();

const AppButton: FC<Props> = ({ onClick, disabled, label, title, className, widthGroup }) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [groupWidth, setGroupWidth] = useState<number | null>(null);

  // 測定: レンダ後に自然幅を測って保存
  useLayoutEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    // 一旦自動幅で測る
    const prevWidth = el.style.width;
    el.style.width = 'auto';
    const rect = el.getBoundingClientRect();
    setNaturalWidth(rect.width);
    el.style.width = prevWidth;
  }, [label]);

  // group 幅の購読と更新
  useEffect(() => {
    if (!widthGroup) return;
    const info = groupRegistry.get(widthGroup) ?? { width: 0, subs: new Set() };
    groupRegistry.set(widthGroup, info);
    const notify = () => setGroupWidth(info.width);
    info.subs.add(notify);

    // 自分の自然幅を反映（最大値を保つ）
    if (naturalWidth && naturalWidth > info.width) {
      info.width = naturalWidth;
      info.subs.forEach((fn) => fn());
    } else {
      // 最初から既存の最大値がある場合はそれを適用
      if (info.width > 0) setGroupWidth(info.width);
    }
    return () => {
      info.subs.delete(notify);
      // 登録がなくなればクリーンアップ（任意）
      if (info.subs.size === 0) {
        // 残しても害はないが、メモリ節約で削除
        // groupRegistry.delete(widthGroup); // 必要なら有効化
      }
    };
  }, [widthGroup, naturalWidth]);

  const style = useMemo(() => {
    const s: React.CSSProperties = { whiteSpace: 'nowrap' };
    if (widthGroup && groupWidth && groupWidth > 0) {
      s.width = `${groupWidth}px`;
    }
    return s;
  }, [widthGroup, groupWidth]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={["app-btn", className || ''].filter(Boolean).join(' ')}
      style={style}
    >
      {label}
    </button>
  );
};

export default AppButton;

