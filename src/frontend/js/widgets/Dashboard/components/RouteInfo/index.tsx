import useRouteInfo from 'widgets/Dashboard/hooks/useRouteInfo';

/**
 * *Temporary
 *
 * A dummy route component for example which displays
 * all data related to the current route
 */
const RouteInfo = ({ title }: { title: string }) => {
  const routeInfo = useRouteInfo();

  return (
    <div data-testid={`RouteInfo-${routeInfo.pathname}`}>
      <h1>{title}</h1>
      <dl>
        <dt>Route information :</dt>
        <dd>
          <pre>{JSON.stringify(routeInfo, null, 2)}</pre>
        </dd>
      </dl>
    </div>
  );
};

export default RouteInfo;
