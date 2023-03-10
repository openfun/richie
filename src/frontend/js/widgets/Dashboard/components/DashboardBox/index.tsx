import { PropsWithChildren, ReactNode } from 'react';
import { PropsWithTestId } from 'types/utils';

type Props = PropsWithTestId<{
  header?: ReactNode;
  footer?: ReactNode;
}>;

export const DashboardBox = ({ header, footer, ...props }: PropsWithChildren<Props>) => {
  return (
    <div className="dashboard-box" {...props}>
      {!!header && <header className="dashboard-box__header">{header}</header>}
      <div className="dashboard-box__content">{props.children}</div>
      {!!footer && <footer className="dashboard-box__footer">{footer}</footer>}
    </div>
  );
};
