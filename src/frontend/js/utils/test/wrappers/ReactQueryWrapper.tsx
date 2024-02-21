import { QueryClient } from '@tanstack/query-core';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { createTestQueryClient } from '../createTestQueryClient';

interface ReactQueryWrapperProps extends PropsWithChildren {
  client?: QueryClient;
}

export const ReactQueryWrapper = ({ children, client }: ReactQueryWrapperProps) => {
  return (
    <QueryClientProvider client={client ?? createTestQueryClient({ user: true })}>
      {children}
    </QueryClientProvider>
  );
};
