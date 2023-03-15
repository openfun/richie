import { PropsWithChildren, useMemo } from 'react';

interface SpinnerProps {
  'aria-labelledby'?: string;
  size?: 'small' | 'large';
  theme?: 'light' | 'primary';
}

/** Component. Displays a rotating CSS loader. */
export const Spinner = (props: PropsWithChildren<SpinnerProps>) => {
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
    <div className="spinner-container" role="status" {...spinnerProps} data-testid="spinner">
      <div className={spinnerClassList} />
      <div className="offscreen">{children}</div>
    </div>
  );
};
