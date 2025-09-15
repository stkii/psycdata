import type { FC, MouseEventHandler, ReactNode } from 'react';

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  label?: ReactNode;
  title?: string;
  className?: string;
};

const ExecuteButton: FC<Props> = ({ onClick, disabled, label = '実行', title, className }) => {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={className}>
      {label}
    </button>
  );
};

export default ExecuteButton;

