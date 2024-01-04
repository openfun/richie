import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

import SignOrganizationContractButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('TeacherDashboardContractsLayout/SignOrganizationContractButton', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <JoanieApiProvider>{children}</JoanieApiProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  };

  beforeAll(() => {
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shouldn't render sign button and <OrganizationContractFrame/> when contractToSignCount > 0", () => {
    render(
      <Wrapper>
        <SignOrganizationContractButton
          organizationId={faker.string.uuid()}
          contractToSignCount={1}
        />
      </Wrapper>,
    );

    expect(screen.getByRole('button', { name: /Sign all pending contracts/ })).toBeInTheDocument();

    const DashboardContractFramePortal = document.getElementsByClassName('ReactModalPortal');
    expect(DashboardContractFramePortal).toHaveLength(1);
  });

  it("shouldn't only render <OrganizationContractFrame/> when contractToSignCount is 0", () => {
    render(
      <Wrapper>
        <SignOrganizationContractButton
          organizationId={faker.string.uuid()}
          contractToSignCount={0}
        />
      </Wrapper>,
    );

    expect(
      screen.queryByRole('button', { name: /Sign all pending contracts/ }),
    ).not.toBeInTheDocument();

    const DashboardContractFramePortal = document.getElementsByClassName('ReactModalPortal');
    expect(DashboardContractFramePortal).toHaveLength(1);
  });
});
