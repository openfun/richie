import { renderHook, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { handle as mockHandle } from 'utils/errors/handle';
import { noop } from 'utils';
import { render } from 'utils/test/render';
import { SessionProvider, useSession } from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: undefined,
  }).one(),
}));

describe('SessionProvider with no authentication', () => {
  it('uses any Provider', async () => {
    render(<SessionProvider>Children</SessionProvider>, { wrapper: null });
    await screen.findByText('Children');
  });

  it('provides default context value if there is no authentication backend', async () => {
    const { result } = renderHook(useSession, {
      wrapper: ({ children }: PropsWithChildren) => <SessionProvider>{children}</SessionProvider>,
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
