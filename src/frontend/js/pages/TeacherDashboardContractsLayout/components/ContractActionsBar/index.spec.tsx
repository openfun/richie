import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';

import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ContractDownloadStatus } from 'pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive';
import ContractActionsBar from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

let mockCanSignContracts: boolean;
let mockContractsToSignCount: number;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign', () => ({
  __esModule: true,
  default: () => ({
    canSignContracts: mockCanSignContracts,
    contractsToSignCount: mockContractsToSignCount,
  }),
}));

let mockDownloadContractArchive: () => Promise<void>;
let mockCreateContractArchive: () => Promise<void>;
let mockDownloadContractArchiveStatus: ContractDownloadStatus;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive', () => ({
  __esModule: true,
  ...jest.requireActual('pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive'),
  default: () => ({
    downloadArchive: mockDownloadContractArchive,
    createContractArchive: mockCreateContractArchive,
    status: mockDownloadContractArchiveStatus,
  }),
}));

let mockHasContractToDownload: boolean;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload/index.tsx', () => ({
  __esModule: true,
  default: () => mockHasContractToDownload,
}));

describe('TeacherDashboardContractsLayout/ContractActionsBar', () => {
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

  beforeEach(() => {
    // useTeacherContractsToSign mocked values
    mockCanSignContracts = true;
    mockContractsToSignCount = 1;

    // useDownloadContractArchive mocked values
    mockHasContractToDownload = false;
    mockDownloadContractArchive = jest.fn(() => Promise.resolve());
    mockCreateContractArchive = jest.fn(() => Promise.resolve());
    mockDownloadContractArchiveStatus = ContractDownloadStatus.IDLE;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shouldn't display both sign and download button", () => {
    mockHasContractToDownload = true;
    mockCanSignContracts = true;
    mockContractsToSignCount = 1;

    render(
      <Wrapper>
        <ContractActionsBar organizationId={faker.string.uuid()} />
      </Wrapper>,
    );

    expect(screen.getByTestId('teacher-contracts-list-actionsBar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign all pending contracts/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request contracts archive/ })).toBeInTheDocument();
  });

  it.each([
    {
      label: "doesn't have contract to download",
      hasContractToDownload: false,
      courseProductRelationId: undefined,
    },
    {
      label: 'has contract to download and courseProductRelationId',
      hasContractToDownload: true,
      courseProductRelationId: faker.string.uuid(),
    },
    {
      label: "doesn't have contract to download  and courseProductRelationId",
      hasContractToDownload: false,
      courseProductRelationId: faker.string.uuid(),
    },
  ])(
    "shouldn't only display sign button when $label",
    ({ hasContractToDownload, courseProductRelationId }) => {
      mockHasContractToDownload = hasContractToDownload;
      mockCanSignContracts = true;
      mockContractsToSignCount = 1;

      render(
        <Wrapper>
          <ContractActionsBar
            courseProductRelationId={courseProductRelationId}
            organizationId={faker.string.uuid()}
          />
        </Wrapper>,
      );

      expect(screen.getByTestId('teacher-contracts-list-actionsBar')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Sign all pending contracts/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Request contracts archive/ }),
      ).not.toBeInTheDocument();
    },
  );

  it("shouldn't only display download button", () => {
    mockHasContractToDownload = true;
    mockCanSignContracts = false;
    mockContractsToSignCount = 0;

    render(
      <Wrapper>
        <ContractActionsBar organizationId={faker.string.uuid()} />
      </Wrapper>,
    );

    expect(screen.getByTestId('teacher-contracts-list-actionsBar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request contracts archive/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Sign all pending contracts/ }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      label: 'only download is available but we have a courseProductRelationId',
      hasContractToDownload: true,
      courseProductRelationId: faker.string.uuid(),
    },
    {
      label: 'no actions are available',
      hasContractToDownload: false,
    },
  ])('should return nothing when $label', ({ hasContractToDownload, courseProductRelationId }) => {
    mockHasContractToDownload = hasContractToDownload;
    mockCanSignContracts = false;
    mockContractsToSignCount = 0;

    render(
      <Wrapper>
        <ContractActionsBar
          courseProductRelationId={courseProductRelationId}
          organizationId={faker.string.uuid()}
        />
      </Wrapper>,
    );

    expect(screen.queryByTestId('teacher-contracts-list-actionsBar')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Request contracts archive/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Sign all pending contracts/ }),
    ).not.toBeInTheDocument();
  });
});
