import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonAnchorAttributes = ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export interface ButtonProps extends ButtonAnchorAttributes {
  color?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' | 'transparent-darkest';
  size?: 'nano' | 'tiny' | 'small' | 'large';
}

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  ({ disabled = false, ...props }, ref) => {
    const classes = ['button'];
    if (props.color) {
      classes.push('button--' + props.color);
    }
    if (props.size) {
      classes.push('button--' + props.size);
    }
    const elementProps = {
      className: classes.join(' '),
      disabled,
    };
    if (props.href && !disabled) {
      return (
        <a {...elementProps} {...props} ref={ref}>
          {props.children}
        </a>
      );
    }
    return (
      <button {...elementProps} {...props} ref={ref}>
        {props.children}
      </button>
    );
  },
);
