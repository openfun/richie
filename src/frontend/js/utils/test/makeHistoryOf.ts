import type { History } from 'hooks/useHistory';

export const makeHistoryOf = (params: Partial<History> = []): History => [
  params[0] ?? {
    state: { name: '', data: {} },
    title: '',
    url: `/`,
  },
  params[1] ?? jest.fn(),
  params[2] ?? jest.fn(),
];
