import { generatePath, Navigate, NavigateProps, useParams } from 'react-router-dom';

interface NavigateWithParamsProps extends NavigateProps {
  to: string;
}

const NavigateWithParams = (navProps: NavigateWithParamsProps) => {
  const params = useParams();
  const to: string = generatePath(navProps.to, params);
  return <Navigate {...navProps} to={to} />;
};

export default NavigateWithParams;
