import { faker } from '@faker-js/faker';
import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import {
  getStoredContractArchiveId,
  isStoredContractArchiveIdExpired,
  storeContractArchiveId,
  unstoreContractArchiveId,
} from './contractArchiveLocalStorage';

describe('contractArchiveLocalStorage', () => {
  afterEach(() => {
    unstoreContractArchiveId();
  });

  it('should store and unstore contractArchiveId and creation date in localStorage', () => {
    expect(
      localStorage.getItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey),
    ).toBeNull();

    const contractArchiveId = faker.string.uuid();
    storeContractArchiveId(contractArchiveId);
    expect(localStorage.getItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey)).toMatch(
      new RegExp(`[0-9]+::${contractArchiveId}`),
    );

    unstoreContractArchiveId();
    expect(
      localStorage.getItem(CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalStorageKey),
    ).toBeNull();
  });

  it('should retrieve contractArchiveId from localStorage', () => {
    const contractArchiveId = faker.string.uuid();
    storeContractArchiveId(contractArchiveId);

    const retrievedcontractArchiveId = getStoredContractArchiveId();
    expect(retrievedcontractArchiveId).toBe(contractArchiveId);
  });

  it.each([
    {
      label: 'outdated creation date in the past',
      now: Date.now(),
      storageCreationTime:
        Date.now() - CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalVaklidityDurationMs * 2,
    },
    {
      label: 'outdated creation date in the future',
      now: Date.now(),
      storageCreationTime:
        Date.now() + CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalVaklidityDurationMs * 2,
    },
  ])(
    'isStoredContractArchiveIdExpired should be true for $label',
    ({ now, storageCreationTime }) => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(storageCreationTime));
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);

      jest.setSystemTime(new Date(now));
      expect(isStoredContractArchiveIdExpired()).toBe(true);

      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    },
  );

  it("isStoredContractArchiveIdExpired should be true false storage isn't expired", () => {
    const now = Date.now();
    const validCreationTime =
      now - CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalVaklidityDurationMs / 2;

    jest.useFakeTimers();
    jest.setSystemTime(new Date(validCreationTime));
    const contractArchiveId = faker.string.uuid();
    storeContractArchiveId(contractArchiveId);

    jest.setSystemTime(new Date(now));
    expect(isStoredContractArchiveIdExpired()).toBe(false);

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});
