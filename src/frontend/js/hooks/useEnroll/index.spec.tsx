import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { renderHook, waitFor } from '@testing-library/react';
import { confirm } from 'utils/indirection/window';
import { Priority } from 'types';
import * as mockFactories from 'utils/test/factories';
import { JoanieCourseRunFactory } from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { useEnroll } from './index';

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => false),
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

/**
 * We are just testing edge case of this hook here, the majority of it testing in realistic
 * conditions in DashboardItemOrder.spec.tsx.
 */
describe('useEnroll ( edge case )', () => {
  const wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return early when a course run is not enrollable', async () => {
    const { result } = renderHook(() => useEnroll([], undefined), { wrapper });
    await waitFor(() => {
      expect(result.current?.enroll).toBeDefined();
    });
    const courseRun = JoanieCourseRunFactory().generate();
    courseRun.state.priority = Priority.FUTURE_NOT_YET_OPEN;
    await result.current.enroll(courseRun);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('should not return early when a course run is enrollable', async () => {
    const { result } = renderHook(() => useEnroll([], undefined), { wrapper });
    await waitFor(() => {
      expect(result.current?.enroll).toBeDefined();
    });
    const courseRun = JoanieCourseRunFactory().generate();
    await result.current.enroll(courseRun);
    expect(confirm).toHaveBeenCalled();
  });
});
