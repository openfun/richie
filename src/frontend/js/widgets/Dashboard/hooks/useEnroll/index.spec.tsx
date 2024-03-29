import { act, renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Priority } from 'types';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseRunFactory } from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { useEnroll } from './index';

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => false),
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

/**
 * We are just testing edge case of this hook here, the majority of it testing in realistic
 * conditions in DashboardItemOrder.spec.tsx.
 */
describe('useEnroll ( edge case )', () => {
  setupJoanieSession();

  it('should return early when a course run is not enrollable', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', {});
    const { result } = renderHook(() => useEnroll([], undefined), {
      wrapper: BaseJoanieAppWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const courseRun = CourseRunFactory().one();
    courseRun.state.priority = Priority.FUTURE_NOT_YET_OPEN;
    await result.current.enroll(courseRun);

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
  });

  it('should not return early when a course run is enrollable', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', {});
    const { result } = renderHook(() => useEnroll([], undefined), {
      wrapper: BaseJoanieAppWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const courseRun = CourseRunFactory().one();

    act(() => {
      result.current.enroll(courseRun);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(true);
  });
});
