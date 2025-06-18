import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { Offer, Organization } from 'types/Joanie';

export interface LocalStorageArchiveFilters {
  organizationId?: Organization['id'];
  offerId?: Offer['id'];
}

const generateLocalStorageKey = ({ organizationId, offerId }: LocalStorageArchiveFilters = {}) => {
  return `${CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey}::${organizationId ?? 'all'}::${offerId ?? 'all'}`;
};

const generateLocalStorageId = (contractArchiveId: string) => {
  return `${Date.now()}::${contractArchiveId}`;
};

const storeContractArchiveId = ({
  contractArchiveId,
  organizationId,
  offerId,
}: {
  contractArchiveId: string;
  organizationId?: Organization['id'];
  offerId?: Offer['id'];
}) => {
  localStorage.setItem(
    generateLocalStorageKey({ organizationId, offerId }),
    generateLocalStorageId(contractArchiveId),
  );
};

const unstoreContractArchiveId = ({ organizationId, offerId }: LocalStorageArchiveFilters = {}) => {
  localStorage.removeItem(generateLocalStorageKey({ organizationId, offerId }));
};

const getStoredContractArchiveId = ({
  organizationId,
  offerId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(generateLocalStorageKey({ organizationId, offerId }));
  if (value === null) {
    return value;
  }

  const [, contractArchiveId] = value.split('::');
  return contractArchiveId;
};

const isStoredContractArchiveIdExpired = ({
  organizationId,
  offerId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(generateLocalStorageKey({ organizationId, offerId }));
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
