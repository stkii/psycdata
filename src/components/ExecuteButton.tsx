import type { FC, MouseEventHandler, ReactNode } from 'react';
import AppButton from './AppButton';

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  label?: ReactNode;
  title?: string;
  className?: string;
};

const ExecuteButton: FC<Props> = ({ onClick, disabled, label = '実行', title, className }) => {
  return (
    <AppButton
      onClick={onClick}
      disabled={disabled}
      label={label}
      title={title}
      className={className}
      widthGroup=""
    />
  );
};

export default ExecuteButton;
