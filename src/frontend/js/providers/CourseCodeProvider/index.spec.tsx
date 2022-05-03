import type { CourseCodeProviderProps } from 'data/CourseCodeProvider/index';
import { CourseCodeProvider, useCourseCode } from 'data/CourseCodeProvider/index';
import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react-hooks';

describe('useCourseCode', () => {
  it('returns the course code stored within CourseCodeProvider', () => {
    const { result } = renderHook(useCourseCode, {
      wrapper: ({ code, children }: PropsWithChildren<CourseCodeProviderProps>) => (
        <CourseCodeProvider code={code}>{children}</CourseCodeProvider>
      ),
      initialProps: { code: '00013' },
    });

    expect(result.current).toBe('00013');
  });

  it('throws an error if it is not used within a CourseCodeProvider', () => {
    const { result } = renderHook(useCourseCode);
    expect(result.error).toEqual(
      new Error('useCourse must be used within a component wrapped by a <CourseProvider />.'),
    );
  });
});
