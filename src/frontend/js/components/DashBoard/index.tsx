import { BrowserRouter } from 'react-router-dom';
import { useIntl } from 'react-intl';
import DashBoardRouter from 'components/DashBoard/Router';
import useDashboardRoutes from 'hooks/useDashboardRoutes';
import getBasename from './utils';

const DashBoard = () => {
  const intl = useIntl();
  const { routes } = useDashboardRoutes();
  return (
    <BrowserRouter basename={getBasename(intl.locale)}>
      <DashBoardRouter routes={routes} />
    </BrowserRouter>
  );
};

export default DashBoard;
