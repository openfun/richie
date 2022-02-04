import { MutationFunction } from 'react-query/types/core/types';
import { UseMutationOptions, UseMutationResult } from 'react-query/types/react/types';
import { useMutation, useQueryClient } from 'react-query';
import { HttpError } from 'utils/errors/HttpError';

/**
 * Hook to use when the mutation relies on the current session. In this way, if the
 * mutation fails with a 401 error response, all session queries are automatically
 * invalidated.
 * @param mutationFn
 * @param options
 */
export function useSessionMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<UseMutationOptions<TData, HttpError, TVariables, TContext>, 'mutationFn'>,
): UseMutationResult<TData, HttpError, TVariables, TContext> {
  const queryClient = useQueryClient();

  const handleError = async (
    error: HttpError,
    variables: TVariables,
    context: TContext | undefined,
  ) => {
    if (error.code === 401) {
      await queryClient.invalidateQueries('user', { exact: true });
    }

    if (options?.onError) {
      return options.onError(error, variables, context);
    }
  };

  return useMutation<TData, HttpError, TVariables, TContext>(mutationFn, {
    ...options,
    onError: handleError,
  });
}
