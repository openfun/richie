import { FC, useMemo } from 'react';

interface SpinnerProps {
  'aria-labelledby'?: string;
  size?: 'small' | 'large';
  theme?: 'light';
}

/** Component. Displays a rotating CSS loader. */
export const Spinner: FC<SpinnerProps> = (props) => {
  const { children, size = 'small', theme } = props;
  const spinnerProps = props['aria-labelledby']
    ? { 'aria-labelledby': props['aria-labelledby'] }
    : {};

  const spinnerClassList = useMemo(() => {
    const classList = ['spinner', `spinner--${size}`];
    if (theme) {
      classList.push(`spinner--${theme}`);
    }

    return classList.join(' ');
  }, [size, theme]);

  return (
    <div className="spinner-container" role="status" {...spinnerProps}>
      <div className={spinnerClassList} />
      <div className="offscreen">{children}</div>
    </div>
  );
};
