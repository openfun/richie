import { FC } from 'react';

interface SpinnerProps {
  'aria-labelledby'?: string;
  size?: 'small' | 'large';
}

/** Component. Displays a rotating CSS loader. */
export const Spinner: FC<SpinnerProps> = (props) => {
  const { children, size } = props;
  const spinnerProps = props['aria-labelledby']
    ? { 'aria-labelledby': props['aria-labelledby'] }
    : {};

  return (
    <div className="spinner-container" role="status" {...spinnerProps}>
      <div className={`spinner spinner--${size || 'small'}`} />
      <div className="offscreen">{children}</div>
    </div>
  );
};
