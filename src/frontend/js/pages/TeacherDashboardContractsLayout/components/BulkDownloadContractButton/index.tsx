import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { useEffect } from 'react';
import useDownloadContractArchive, {
  ContractDownloadStatus,
} from 'pages/TeacherDashboardContractsLayout/hooks/useDownloadContractArchive';
import { CourseProductRelation, Organization } from 'types/Joanie';

const messages = defineMessages({
  bulkDownloadButtonDownloadLabel: {
    defaultMessage: 'Download contracts archive',
    description: 'The label of the bulk download button when the zip archive is ready for download',
    id: 'pages.TeacherDashboardContractsLayout.BulkDownloadContractButton.bulkDownloadButtonDownloadLabel',
  },
  bulkDownloadButtonPendingLabel: {
    defaultMessage: 'Generating contracts archive...',
    description: 'The label of the bulk download button when archive generation is pending',
    id: 'pages.TeacherDashboardContractsLayout.BulkDownloadContractButton.bulkDownloadButtonPendingLabel',
  },
  bulkDownloadButtonRequestArchiveLabel: {
    defaultMessage: 'Request contracts archive',
    description: 'The label of the bulk download button to request the generation of a zip archive',
    id: 'pages.TeacherDashboardContractsLayout.BulkDownloadContractButton.bulkDownloadButtonRequestArchiveLabel',
  },
});

interface BulkDownloadContractButtonProps {
  organizationId?: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const BulkDownloadContractButton = ({
  organizationId,
  courseProductRelationId,
}: BulkDownloadContractButtonProps) => {
  const { downloadContractArchive, createContractArchive, status } = useDownloadContractArchive({
    organizationId,
    courseProductRelationId,
  });

  useEffect(() => {
    // Trigger contract's archive polling when generation had already been requested
    if (status === ContractDownloadStatus.PENDING) {
      createContractArchive();
    }
  }, [status]);

  if (status === ContractDownloadStatus.PENDING) {
    return (
      <Button
        disabled={true}
        color="tertiary"
        size="small"
        icon={<div className="spinner spinner--small" />}
      >
        <FormattedMessage {...messages.bulkDownloadButtonPendingLabel} />
      </Button>
    );
  }

  return (
    <Button
      onClick={downloadContractArchive}
      disabled={status === ContractDownloadStatus.INITIALIZING}
      color={status === ContractDownloadStatus.READY ? 'primary' : 'tertiary'}
      size="small"
      icon={<span className="material-icons">download</span>}
    >
      <FormattedMessage
        {...(status === ContractDownloadStatus.IDLE
          ? messages.bulkDownloadButtonRequestArchiveLabel
          : messages.bulkDownloadButtonDownloadLabel)}
      />
    </Button>
  );
};

export default BulkDownloadContractButton;
