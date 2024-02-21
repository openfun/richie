import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
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

  afterEach(() => {
    fetchMock.restore();
  });

  it('should display sign button user have some contract to sign', () => {
    render(
      <Wrapper>
        <SignOrganizationContractButton
          organizationId={faker.string.uuid()}
          contractToSignCount={12}
        />
      </Wrapper>,
    );

    expect(
      screen.getByRole('button', { name: 'Sign all pending contracts (12)' }),
    ).toBeInTheDocument();
    const DashboardContractFramePortal = document.getElementsByClassName('ReactModalPortal');
    expect(DashboardContractFramePortal).toHaveLength(1);
  });

  it("shouldn't display sign button user don't have some contract to sign", () => {
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

  it.each([
    {
      label: "organization's contracts",
      organizationId: faker.string.uuid(),
      courseProductRelationIds: undefined,
    },
    {
      label: "organization's training contracts",
      organizationId: faker.string.uuid(),
      courseProductRelationIds: [faker.string.uuid()],
    },
  ])('should open $label frame on click', async ({ organizationId, courseProductRelationIds }) => {
    render(
      <Wrapper>
        <SignOrganizationContractButton
          organizationId={organizationId}
          courseProductRelationIds={courseProductRelationIds}
          contractToSignCount={12}
        />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', { name: /Sign all pending contracts/ });
    const user = userEvent.setup();

    let getInvitationLinkUrl = `https://joanie.test/api/v1.0/organizations/${organizationId}/contracts-signature-link/`;
    if (courseProductRelationIds) {
      getInvitationLinkUrl += `?course_product_relation_ids=${courseProductRelationIds[0]}`;
    }

    fetchMock.get(getInvitationLinkUrl, {
      invitation_link: 'https://dummysignaturebackend.fr',
      contract_ids: [],
    });
    await user.click($button);

    expect(screen.getByTestId('dashboard-contract-frame')).toBeInTheDocument();
    expect(fetchMock.called(getInvitationLinkUrl)).toBe(true);
  });
});
