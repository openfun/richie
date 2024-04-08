import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { CourseProductRelation, Organization } from 'types/Joanie';

export interface LocalStorageArchiveFilters {
  organizationId?: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const generateLocalStorageKey = ({
  organizationId,
  courseProductRelationId,
}: LocalStorageArchiveFilters = {}) => {
  return `${CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey}::${organizationId ?? 'all'}::${courseProductRelationId ?? 'all'}`;
};

const generateLocalStorageId = (contractArchiveId: string) => {
  return `${Date.now()}::${contractArchiveId}`;
};

const storeContractArchiveId = ({
  contractArchiveId,
  organizationId,
  courseProductRelationId,
}: {
  contractArchiveId: string;
  organizationId?: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}) => {
  localStorage.setItem(
    generateLocalStorageKey({ organizationId, courseProductRelationId }),
    generateLocalStorageId(contractArchiveId),
  );
};

const unstoreContractArchiveId = ({
  organizationId,
  courseProductRelationId,
}: LocalStorageArchiveFilters = {}) => {
  localStorage.removeItem(generateLocalStorageKey({ organizationId, courseProductRelationId }));
};

const getStoredContractArchiveId = ({
  organizationId,
  courseProductRelationId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(
    generateLocalStorageKey({ organizationId, courseProductRelationId }),
  );
  if (value === null) {
    return value;
  }

  const [, contractArchiveId] = value.split('::');
  return contractArchiveId;
};

const isStoredContractArchiveIdExpired = ({
  organizationId,
  courseProductRelationId,
}: LocalStorageArchiveFilters = {}) => {
  const value = localStorage.getItem(
    generateLocalStorageKey({ organizationId, courseProductRelationId }),
  );
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
