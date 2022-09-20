import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';

type ButtonAnchorAttributes = ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

interface ButtonProps extends ButtonAnchorAttributes {
  color?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary';
  size?: 'nano' | 'tiny' | 'small' | 'large';
}

export const Button: FC<ButtonProps> = ({ disabled = false, ...props }) => {
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
      <a {...elementProps} {...props}>
        {props.children}
      </a>
    );
  }
  return (
    <button {...elementProps} {...props}>
      {props.children}
    </button>
  );
};
