import { renderHook } from '@testing-library/react';
import { noop } from 'utils';
import { ProductRelationProvider, useCourseProduct } from '.';

describe('useCourseProduct', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the course code stored within ProductRelationProvider', () => {
    // Refactor of the wrapper parameters is caused by the behavior describe here
    // https://stackoverflow.com/questions/72346908/react-testing-library-merged-with-testing-library-react-hooks-wrapper-inconsis
    const { result } = renderHook(useCourseProduct, {
      wrapper: ({ children }) => (
        <ProductRelationProvider
          courseCode="00013"
          productId="dce9acb4-df59-4856-a5a8-1b732bc9b565"
        >
          {children}
        </ProductRelationProvider>
      ),
    });
    expect(result.current).toStrictEqual({
      courseCode: '00013',
      enrollmentId: undefined,
      productId: 'dce9acb4-df59-4856-a5a8-1b732bc9b565',
      key: '00013_dce9acb4-df59-4856-a5a8-1b732bc9b565',
    });
  });

  it('returns the enrollment id stored within CourseProductProvider', () => {
    const { result } = renderHook(useCourseProduct, {
      wrapper: ({ children }) => (
        <ProductRelationProvider
          enrollmentId="88888888-df59-4856-a5a8-1b732bc9b565"
          productId="dce9acb4-df59-4856-a5a8-1b732bc9b565"
        >
          {children}
        </ProductRelationProvider>
      ),
    });
    expect(result.current).toStrictEqual({
      courseCode: undefined,
      enrollmentId: '88888888-df59-4856-a5a8-1b732bc9b565',
      productId: 'dce9acb4-df59-4856-a5a8-1b732bc9b565',
      key: '88888888-df59-4856-a5a8-1b732bc9b565+dce9acb4_df59-4856-a5a8-1b732bc9b565',
    });
  });

  it('throws an error if it is not used within a CourseProductProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    expect(() => {
      renderHook(useCourseProduct);
    }).toThrow(
      'useCourseProduct must be used within a component wrapped by a <ProductRelationProvider />.',
    );
  });
});
