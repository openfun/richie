import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'large';
}

/** Component. Displays a rotating CSS loader. */
export const Spinner = ({ size }: SpinnerProps) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner--${size || 'small'}`} />
    </div>
  );
};
