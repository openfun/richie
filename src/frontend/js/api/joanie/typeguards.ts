import { ApiError, Course } from './gen';

export const isApiError = (error: unknown): error is ApiError => {
  return (error as ApiError).name === 'ApiError';
};

export function isCourse(course: Course | string): course is Course {
  return (course as Course).code !== undefined;
}
