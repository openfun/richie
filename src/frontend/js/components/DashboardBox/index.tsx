import { FC, ReactNode } from 'react';
import { PropsWithTestId } from 'types/utils';

type Props = PropsWithTestId<{
  header?: ReactNode;
  footer?: ReactNode;
}>;

export const DashboardBox: FC<Props> = ({ header, footer, ...props }) => {
  return (
    <div className="dashboard-box" {...props}>
      {!!header && <header className="dashboard-box__header">{header}</header>}
      <div className="dashboard-box__content">{props.children}</div>
      {!!footer && <footer className="dashboard-box__footer">{footer}</footer>}
    </div>
  );
};
