import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';

/**
 * Hook to use when the mutation relies on the current session. In this way, if the
 * mutation fails with a 401 error response, all session queries are automatically
 * invalidated.
 * @param mutationFn
 * @param options
 */
export function useSessionMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options?: UseMutationOptions<TData, HttpError, TVariables, TContext>,
): UseMutationResult<TData, HttpError, TVariables, TContext> {
  const queryClient = useQueryClient();

  const handleError = async (
    error: HttpError,
    variables: TVariables,
    context: TContext | undefined,
  ) => {
    if (error.code === HttpStatusCode.UNAUTHORIZED) {
      await queryClient.invalidateQueries({ queryKey: ['user'], exact: true });
    }

    if (options?.onError) {
      return options.onError(error, variables, context);
    }
  };

  return useMutation<TData, HttpError, TVariables, TContext>({
    ...options,
    onError: handleError,
  });
}
