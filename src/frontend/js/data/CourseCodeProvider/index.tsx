import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { Maybe } from 'types/utils';

const Context = createContext<Maybe<string>>(undefined);

export interface CourseCodeProviderProps {
  code: string;
}

/**
 * A React Provider which aims to wrap components related to a specific course. In this
 * way we are able to pass down course's code to children.
 */
export const CourseCodeProvider = ({
  code,
  children,
}: PropsWithChildren<CourseCodeProviderProps>) => (
  <Context.Provider value={code}>{children}</Context.Provider>
);

/**
 * A hook to use within `CourseCodeProvider`. It returns the course code context.
 */
export const useCourseCode = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useCourse must be used within a component wrapped by a <CourseProvider />.');
  }
  return context;
};
