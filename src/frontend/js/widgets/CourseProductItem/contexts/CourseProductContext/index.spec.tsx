import { renderHook } from '@testing-library/react';
import { noop } from 'utils';
import { CourseProductProvider, useCourseProduct } from '.';

describe('useCourseProduct', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the course code stored within CourseProductProvider', () => {
    // Refactor of the wrapper parameters is caused by the behavior describe here
    // https://stackoverflow.com/questions/72346908/react-testing-library-merged-with-testing-library-react-hooks-wrapper-inconsis
    const { result } = renderHook(useCourseProduct, {
      wrapper: ({ children }) => (
        <CourseProductProvider courseCode="00013" productId="dce9acb4-df59-4856-a5a8-1b732bc9b565">
          {children}
        </CourseProductProvider>
      ),
    });
    expect(result.current).toStrictEqual({
      courseCode: '00013',
      productId: 'dce9acb4-df59-4856-a5a8-1b732bc9b565',
      key: '00013+dce9acb4-df59-4856-a5a8-1b732bc9b565',
    });
  });

  it('throws an error if it is not used within a CourseProductProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    expect(() => {
      renderHook(useCourseProduct);
    }).toThrow(
      'useCourseProduct must be used within a component wrapped by a <CourseProductProvider />.',
    );
  });
});
