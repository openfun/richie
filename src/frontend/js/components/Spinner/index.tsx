import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'large';
  children: React.ReactNode;
}

/** Component. Displays a rotating CSS loader. */
export const Spinner = ({ children, size }: SpinnerProps) => {
  return (
    <div className="spinner-container" role="status">
      <div className={`spinner spinner--${size || 'small'}`} />
      <div className="offscreen">{children}</div>
    </div>
  );
};
