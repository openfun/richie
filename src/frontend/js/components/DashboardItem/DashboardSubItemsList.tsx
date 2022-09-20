import { Children, ReactNode } from 'react';

interface DashboardSubItemsListProps {
  subItems: ReactNode[];
}

export const DashboardSubItemsList = ({ subItems }: DashboardSubItemsListProps) => {
  return (
    <div className="dashboard-sub-item-list">
      {Children.map(subItems, (subItem) => (
        <div className="dashboard-sub-item-list__item">{subItem}</div>
      ))}
    </div>
  );
};
