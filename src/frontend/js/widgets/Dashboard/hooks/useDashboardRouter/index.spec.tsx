import { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import useDashboardRoutes from '.';

describe('useDashboardRouter', () => {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => <IntlWrapper>{children}</IntlWrapper>;

  it('should render path according to the active language', () => {
    const { result } = renderHook(useDashboardRoutes, { wrapper: Wrapper });

    expect(result.current.routes[0].path).toBe('/');
    expect(
      result.current.routes[0].children?.find(({ path }) => path === '/courses'),
    ).toBeDefined();
    expect(
      result.current.routes[0].children?.find(({ path }) => path === '/preferences'),
    ).toBeDefined();
  });
});
