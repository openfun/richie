import c from 'classnames';
import { PropsWithChildren } from 'react';

interface FormProps
  extends React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {}

const Form = ({ children, onSubmit, className, name, noValidate = true }: FormProps) => {
  return (
    <form className={c('form', className)} name={name} onSubmit={onSubmit} noValidate={noValidate}>
      {children}
    </form>
  );
};

Form.Column = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={c('form-column', className)}>{children}</div>;
};

Form.Row = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={c('form-row', className)}>{children}</div>;
};

Form.RowButtonContainer = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={c('form-row-button-container', className)}>{children}</div>;
};

Form.Footer = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={c('form-footer', className)}>{children}</div>;
};

export default Form;
