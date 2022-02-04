import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import { renderHook } from '@testing-library/react-hooks';
import { handle as mockHandle } from 'utils/errors/handle';
import { noop } from 'utils';
import { render, screen } from '@testing-library/react';
import { SessionProvider, useSession } from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: undefined,
  }).generate(),
}));

describe('SessionProvider with no authentication', () => {
  it('uses any Provider', async () => {
    render(<SessionProvider>Children</SessionProvider>);
    await screen.findByText('Children');
  });

  it('provides default context value if there is no authentication backend', async () => {
    const { result } = renderHook(useSession, {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>,
    });
    expect(result.current.user).toBeNull();
    expect(result.current.destroy).toEqual(noop);
    expect(result.current.login).toEqual(noop);
    expect(result.current.register).toEqual(noop);
    expect(mockHandle).toHaveBeenNthCalledWith(
      1,
      new Error(
        'You attempt to use `useSession` hook but there is no authentication backend configured.',
      ),
    );
  });
});
