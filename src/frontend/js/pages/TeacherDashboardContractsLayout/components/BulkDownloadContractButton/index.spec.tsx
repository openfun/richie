import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';

import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ContractDownloadStatus } from 'pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive';

import { CourseProductRelationFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { unstoreContractArchiveId } from 'pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive/contractArchiveLocalStorage';
import BulkDownloadContractButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

let mockDownloadContractArchive = jest.fn(() => Promise<void>);
let mockCreateContractArchive = jest.fn(() => Promise<void>);
let mockDownloadContractArchiveStatus: ContractDownloadStatus;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive', () => ({
  __esModule: true,
  ...jest.requireActual('pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive'),
  default: () => ({
    downloadContractArchive: mockDownloadContractArchive,
    createContractArchive: mockCreateContractArchive,
    status: mockDownloadContractArchiveStatus,
  }),
}));

let mockHasContractToDownload: boolean;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload/index.tsx', () => ({
  __esModule: true,
  default: () => mockHasContractToDownload,
}));

describe.each([
  {
    testLabel: 'for all organization and all trainings',
    organization: undefined,
    courseProductRelation: undefined,
  },
  {
    testLabel: 'for a training in an organization',
    organization: OrganizationFactory().one(),
    courseProductRelation: CourseProductRelationFactory().one(),
  },
  {
    testLabel: 'for an organization',
    organization: OrganizationFactory().one(),
    courseProductRelation: undefined,
  },
  {
    testLabel: 'for a training',
    organization: undefined,
    courseProductRelation: CourseProductRelationFactory().one(),
  },
])(
  'TeacherDashboardContractsLayout/BulkDownloadContractButton $testLabel',
  ({ organization, courseProductRelation }) => {
    const Wrapper = ({ children }: PropsWithChildren) => {
      return (
        <IntlProvider locale="en">
          <QueryClientProvider client={createTestQueryClient({ user: true })}>
            <JoanieApiProvider>{children}</JoanieApiProvider>
          </QueryClientProvider>
        </IntlProvider>
      );
    };

    beforeEach(() => {
      // useDownloadContractArchive mocked values
      mockHasContractToDownload = false;
      mockDownloadContractArchive = jest.fn(() => Promise<void>);
      mockCreateContractArchive = jest.fn(() => Promise<void>);
      mockDownloadContractArchiveStatus = ContractDownloadStatus.IDLE;
    });

    afterEach(() => {
      jest.resetAllMocks();
      unstoreContractArchiveId({
        organizationId: organization ? organization.id : undefined,
        courseProductRelationId: courseProductRelation ? courseProductRelation.id : undefined,
      });
    });

    it("shouldn't render generate archive button for archive generation IDLE", async () => {
      mockDownloadContractArchiveStatus = ContractDownloadStatus.IDLE;

      render(
        <Wrapper>
          <BulkDownloadContractButton
            organizationId={organization?.id ?? undefined}
            courseProductRelationId={courseProductRelation?.id ?? undefined}
          />
        </Wrapper>,
      );

      const $button = screen.queryByRole('button', { name: /Request contracts archive/ });
      expect($button).toBeInTheDocument();
      expect($button).toBeEnabled();

      const user = userEvent.setup();
      await user.click($button!);
      expect(mockDownloadContractArchive).toHaveBeenCalledTimes(1);
    });

    it("shouldn't render waiting archive button for archive generation PENDING", async () => {
      mockDownloadContractArchiveStatus = ContractDownloadStatus.PENDING;

      render(
        <Wrapper>
          <BulkDownloadContractButton
            organizationId={organization?.id ?? undefined}
            courseProductRelationId={courseProductRelation?.id ?? undefined}
          />
        </Wrapper>,
      );

      const $button = screen.queryByRole('button', { name: /Generating contracts archive.../ });
      expect($button).toBeInTheDocument();
      expect($button).toBeDisabled();

      const user = userEvent.setup();
      await user.click($button!);
      expect(mockDownloadContractArchive).not.toHaveBeenCalled();
    });

    it("shouldn't render download button for archive is READY", async () => {
      mockDownloadContractArchiveStatus = ContractDownloadStatus.READY;

      render(
        <Wrapper>
          <BulkDownloadContractButton
            organizationId={organization?.id ?? undefined}
            courseProductRelationId={courseProductRelation?.id ?? undefined}
          />
        </Wrapper>,
      );

      const $button = screen.queryByRole('button', { name: /Download contracts archive/ });
      expect($button).toBeInTheDocument();
      expect($button).toBeEnabled();

      const user = userEvent.setup();
      await user.click($button!);
      expect(mockDownloadContractArchive).toHaveBeenCalledTimes(1);
    });

    it('should render disabled download button when INITIALIZING', async () => {
      mockDownloadContractArchiveStatus = ContractDownloadStatus.INITIALIZING;

      render(
        <Wrapper>
          <BulkDownloadContractButton
            organizationId={organization?.id ?? undefined}
            courseProductRelationId={courseProductRelation?.id ?? undefined}
          />
        </Wrapper>,
      );

      const $button = screen.queryByRole('button', { name: /Download contracts archive/ });
      expect($button).toBeInTheDocument();
      expect($button).toBeDisabled();

      const user = userEvent.setup();
      await user.click($button!);
      expect(mockDownloadContractArchive).not.toHaveBeenCalled();
    });
  },
);
