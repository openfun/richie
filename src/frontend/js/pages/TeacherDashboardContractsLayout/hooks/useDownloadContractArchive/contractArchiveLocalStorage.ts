import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { Offering, Organization } from 'types/Joanie';

export interface LocalStorageArchiveFilters {
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const generateLocalStorageKey = ({
  organizationId,
  offeringId,
}: LocalStorageArchiveFilters = {}) => {
  return `${CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey}::${organizationId ?? 'all'}::${offeringId ?? 'all'}`;
};

const generateLocalStorageId = (contractArchiveId: string) => {
  return `${Date.now()}::${contractArchiveId}`;
};

const storeContractArchiveId = ({
  contractArchiveId,
  organizationId,
  offeringId,
}: {
  contractArchiveId: string;
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}) => {
  localStorage.setItem(
    generateLocalStorageKey({ organizationId, offeringId }),
    generateLocalStorageId(contractArchiveId),
  );
};

const unstoreContractArchiveId = ({
  organizationId,
  offeringId,
}: LocalStorageArchiveFilters = {}) => {
  localStorage.removeItem(generateLocalStorageKey({ organizationId, offeringId }));
};

const getStoredContractArchiveId = ({
  organizationId,
  offeringId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(generateLocalStorageKey({ organizationId, offeringId }));
  if (value === null) {
    return value;
  }

  const [, contractArchiveId] = value.split('::');
  return contractArchiveId;
};

const isStoredContractArchiveIdExpired = ({
  organizationId,
  offeringId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(generateLocalStorageKey({ organizationId, offeringId }));
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
  generateLocalStorageKey,
  storeContractArchiveId,
  unstoreContractArchiveId,
  getStoredContractArchiveId,
  isStoredContractArchiveIdExpired,
};
