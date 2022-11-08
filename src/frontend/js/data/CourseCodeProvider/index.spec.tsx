import { renderHook } from '@testing-library/react';
import { CourseCodeProvider, useCourseCode } from 'data/CourseCodeProvider/index';
import { noop } from 'utils';

describe('useCourseCode', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(noop);
  });

  it('returns the course code stored within CourseCodeProvider', () => {
    // Refactor of the wrapper parameters is caused by the behavior describe here
    // https://stackoverflow.com/questions/72346908/react-testing-library-merged-with-testing-library-react-hooks-wrapper-inconsis
    const { result } = renderHook(useCourseCode, {
      wrapper: ({ children }) => <CourseCodeProvider code="00013">{children}</CourseCodeProvider>,
      initialProps: { code: '00013' },
    });
    expect(result.current).toBe('00013');
  });

  it('throws an error if it is not used within a CourseCodeProvider', () => {
    expect(() => {
      renderHook(useCourseCode);
    }).toThrow('useCourse must be used within a component wrapped by a <CourseProvider />.');
  });
});
