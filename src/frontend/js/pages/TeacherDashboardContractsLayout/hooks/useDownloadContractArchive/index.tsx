import { useEffect, useMemo, useState } from 'react';
import useContractArchive from 'hooks/useContractArchive';
import useCheckContractArchiveExists from '../useCheckContractArchiveExists';
import useHasContractToDownload from '../useHasContractToDownload';
import {
  storeContractArchiveId,
  unstoreContractArchiveId,
  getStoredContractArchiveId,
  isStoredContractArchiveIdExpired,
} from './contractArchiveLocalStorage';

export enum ContractDownloadStatus {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  PENDING = 'pending',
  READY = 'ready',
}

interface UseTeacherContractsBulkDownloadProps {
  organizationId: string;
}

const useDownloadContractArchive = ({ organizationId }: UseTeacherContractsBulkDownloadProps) => {
  // Contract's archive api interface
  const {
    methods: { get: getArchive, create: createArchive },
  } = useContractArchive();

  // Simple hook that verifiy if current user have some fully signed contracts to download.
  const hasContractToDownload = useHasContractToDownload(organizationId);

  // Component state of the localstorage contract's archive id
  const [contractArchiveId, setContractArchiveId] = useState<string | null>(
    getStoredContractArchiveId(),
  );

  // Hook that handle contract archive existence check and recursive polling of it.
  const { isPolling, isContractArchiveExists, checkArchiveExists } = useCheckContractArchiveExists({
    enable: !!hasContractToDownload,
  });

  // Stored contract's archive id have to be cleanup at some point.
  // this expired logic is handle by ./contractArchiveLocalStorage and
  // this isContractArchiveIdExpired track it at a component level.
  const [isContractArchiveIdExpired, setIsContractArchiveIdExpired] = useState<boolean | null>(
    null,
  );

  // This state track if the user have request the download or not.
  // if he have click the download button, it will be true.
  // if he just load the page, it will be false.
  const [isDownloadRequest, setIsDownloadRequest] = useState(false);

  // Here we compute the download status.
  // It stay as INITIALIZING until all needed data get fetched.
  // Then it become either:
  // * READY: the archive is ready to be download from the server
  // * PENDING: the archive is generating on the server
  // * IDLE: A fresh new download process
  const contractDownloadStatus = useMemo(() => {
    if (
      [hasContractToDownload, isContractArchiveExists, isContractArchiveIdExpired].includes(null)
    ) {
      return ContractDownloadStatus.INITIALIZING;
    }

    if (hasContractToDownload && contractArchiveId) {
      if (isContractArchiveExists) {
        return ContractDownloadStatus.READY;
      }

      return ContractDownloadStatus.PENDING;
    }

    return ContractDownloadStatus.IDLE;
  }, [
    hasContractToDownload,
    contractArchiveId,
    isContractArchiveExists,
    isContractArchiveIdExpired,
  ]);

  const clearContractArchive = () => {
    setIsDownloadRequest(false);
    setContractArchiveId(null);
    unstoreContractArchiveId();
  };

  // Either download the archive
  // or flag the download as requested and request the archive's creation
  const downloadContractArchive = async () => {
    if (isContractArchiveExists && contractArchiveId !== null) {
      await getArchive(contractArchiveId);
      clearContractArchive();
    } else {
      // When archive is ready and download is requested
      // a useEffect will trigger the download.
      setIsDownloadRequest(true);
      createContractArchive();
    }
  };

  // Request the archive's creation if needed
  // then can start archive's polling (if option.polling === true)
  const createContractArchive = async () => {
    let newContractArchiveId;
    if (contractArchiveId === null) {
      newContractArchiveId = await createArchive(organizationId);
      setContractArchiveId(newContractArchiveId);
      storeContractArchiveId(newContractArchiveId);
    } else {
      newContractArchiveId = contractArchiveId;
    }

    if (!isPolling) {
      checkArchiveExists(newContractArchiveId, { polling: true });
    }
  };

  // Here we check the validity of stored id timestamp
  // if an id is expired, we'll either:
  // * when it exists on the server: switch expired state but nothing else
  // * when didn't exists on the server: switch expired state and clear download data.
  useEffect(() => {
    if (isContractArchiveExists === null) {
      return;
    }

    if (isStoredContractArchiveIdExpired() && isContractArchiveExists === false) {
      setIsContractArchiveIdExpired(true);
      clearContractArchive();
    } else {
      setIsContractArchiveIdExpired(false);
    }
  }, [contractDownloadStatus, isContractArchiveExists]);

  // When the archive become ready for download
  // this effect will trigger the download
  // if it have been previously requested by the user
  useEffect(() => {
    if (isDownloadRequest && isContractArchiveExists) {
      downloadContractArchive();
    }
  }, [isDownloadRequest, isContractArchiveExists]);

  return {
    status: contractDownloadStatus,
    downloadContractArchive,
    createContractArchive,
  };
};

export default useDownloadContractArchive;
