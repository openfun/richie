import { useEffect, useRef, useState } from 'react';
import useContractArchive from 'hooks/useContractArchive';
import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { Nullable } from 'types/utils';
import { getStoredContractArchiveId } from '../useDownloadContractArchive/contractArchiveLocalStorage';

export interface UseCheckContractArchiveExistsProps {
  enable: boolean;
}

const useCheckContractArchiveExist = (
  { enable }: UseCheckContractArchiveExistsProps = { enable: true },
) => {
  // Contract's archive api interface
  const {
    methods: { check: checkArchiveExist },
  } = useContractArchive();

  // Store if the contract's archive exists or not on the server
  // stay null until fetched
  const [isContractArchiveExists, setIsContractArchiveExists] = useState<Nullable<boolean>>(null);

  const timeoutRef = useRef<NodeJS.Timeout>();

  // This method will check if the archive exists on the server
  // option.polling === true will recursivly poll archive existence
  const checkArchiveExists = async (
    archiveId: string,
    options: { polling: boolean } = { polling: true },
  ) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;

    const isExists = await checkArchiveExist(archiveId);
    setIsContractArchiveExists(isExists);

    if (!options.polling) {
      return;
    }

    if (!isExists) {
      timeoutRef.current = setTimeout(
        () => checkArchiveExists(archiveId),
        CONTRACT_DOWNLOAD_SETTINGS.pollInterval,
      );
    }
  };

  // This effect will initialize isContractArchiveExists value
  useEffect(() => {
    const storedContractArchiveId = getStoredContractArchiveId();
    if (enable && storedContractArchiveId) {
      checkArchiveExists(storedContractArchiveId, { polling: false });
    } else {
      setIsContractArchiveExists(false);
    }
  }, [enable]);

  // Be sure to clear any timeout before unmouting the hook.
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isPolling: !!timeoutRef.current,
    isContractArchiveExists,
    checkArchiveExists,
  };
};

export default useCheckContractArchiveExist;
