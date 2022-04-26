import { render, screen } from '@testing-library/react';
import * as mockFactories from 'utils/test/factories';
import { IntlProvider } from 'react-intl';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { QueryClientProvider } from 'react-query';
import { PropsWithChildren } from 'react';
import createQueryClient from 'utils/react-query/createQueryClient';
import DashBoard from 'components/DashBoard';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

const Wrapper = ({ children }: PropsWithChildren<{}>) => (
  <IntlProvider locale="en">
    <QueryClientProvider client={createQueryClient()}>
      <JoanieApiProvider>{children}</JoanieApiProvider>
    </QueryClientProvider>
  </IntlProvider>
);

describe('<DashBoard />', () => {
  it('shows a dashboard', async () => {
    render(
      <Wrapper>
        <DashBoard />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 1, name: 'Dashboard' });
  });
});
