import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';

const generateLocalStorageId = (contractArchiveId: string) => {
  return `${Date.now()}::${contractArchiveId}`;
};

const storeContractArchiveId = (contractArchiveId: string) => {
  localStorage.setItem(
    CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey,
    generateLocalStorageId(contractArchiveId),
  );
};

const unstoreContractArchiveId = () => {
  localStorage.removeItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey);
};

const getStoredContractArchiveId = () => {
  const value = localStorage.getItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey);
  if (value === null) {
    return value;
  }

  const [, contractArchiveId] = value.split('::');
  return contractArchiveId;
};

const isStoredContractArchiveIdExpired = () => {
  const value = localStorage.getItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey);
  if (value === null) {
    return false;
  }
  const [creationTimestamp] = value.split('::');

  const bounds: number[] = [Date.now(), parseInt(creationTimestamp, 10)];
  // reverse bounds when computer time change.
  if (bounds[0] > bounds[1]) {
    bounds.reverse();
  }

  const [begin, end] = bounds;
  return end - begin > CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalVaklidityDurationMs;
};

export {
  storeContractArchiveId,
  unstoreContractArchiveId,
  getStoredContractArchiveId,
  isStoredContractArchiveIdExpired,
};
