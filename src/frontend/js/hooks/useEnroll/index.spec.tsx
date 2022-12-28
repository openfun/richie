import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
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
    fetchMock.restore();
  });

  it('should return early when a course run is not enrollable', async () => {
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', {});
    const { result } = renderHook(() => useEnroll([], undefined), { wrapper });
    await waitFor(() => {
      expect(result.current?.enroll).toBeDefined();
    });
    const courseRun = JoanieCourseRunFactory().generate();
    courseRun.state.priority = Priority.FUTURE_NOT_YET_OPEN;
    await result.current.enroll(courseRun);

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
  });

  it('should not return early when a course run is enrollable', async () => {
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', {});
    const { result } = renderHook(() => useEnroll([], undefined), { wrapper });
    await waitFor(() => {
      expect(result.current?.enroll).toBeDefined();
    });
    const courseRun = JoanieCourseRunFactory().generate();
    await result.current.enroll(courseRun);

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(true);
  });
});
