import c from 'classnames';
import { PropsWithChildren } from 'react';

interface FormProps extends PropsWithChildren {
  onSubmit?: (e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<void>;
  noValidate?: boolean;
  className?: string;
  name?: string;
}

const Form = ({ children, onSubmit, className, name, noValidate = true }: FormProps) => {
  return (
    <form className={c('form', className)} name={name} onSubmit={onSubmit} noValidate={noValidate}>
      {children}
    </form>
  );
};

Form.Row = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={c('form-row', className)}>{children}</div>;
};

export default Form;
