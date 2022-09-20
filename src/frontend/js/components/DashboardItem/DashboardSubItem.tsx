import { ReactNode } from 'react';

interface DashboardSubItemProps {
  title: string;
  footer?: ReactNode;
}

export const DashboardSubItem = (props: DashboardSubItemProps) => {
  return (
    <div className="dashboard-sub-item" data-testid="dashboard-sub-item">
      <header className="dashboard-sub-item__header">
        <h6>{props.title}</h6>
      </header>
      <footer className="dashboard-sub-item__footer">{props.footer}</footer>
    </div>
  );
};
