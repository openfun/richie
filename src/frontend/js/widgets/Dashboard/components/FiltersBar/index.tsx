import { PropsWithChildren } from 'react';

const FiltersBar = ({ children }: PropsWithChildren) => {
  return (
    <div className="dashboard__page__actions-row dashboard__page__actions-row--end">{children}</div>
  );
};

export default FiltersBar;
