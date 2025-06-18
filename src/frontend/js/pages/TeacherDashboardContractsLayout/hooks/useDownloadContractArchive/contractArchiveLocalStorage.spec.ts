import { faker } from '@faker-js/faker';
import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { OfferFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import {
  LocalStorageArchiveFilters,
  generateLocalStorageKey,
  getStoredContractArchiveId,
  isStoredContractArchiveIdExpired,
  storeContractArchiveId,
  unstoreContractArchiveId,
} from './contractArchiveLocalStorage';

describe.each([
  {
    testLabel: 'for all organization and all trainings',
    organization: undefined,
    offer: undefined,
    existingOrganization: undefined,
    existingOffer: undefined,
  },
  {
    testLabel: 'for a training in an organization',
    organization: OrganizationFactory().one(),
    offer: OfferFactory().one(),
    existingOrganization: undefined,
    existingOffer: undefined,
  },
  {
    testLabel: 'for an organization',
    organization: OrganizationFactory().one(),
    offer: undefined,
    existingOrganization: undefined,
    existingOffer: undefined,
  },
  {
    testLabel: 'for a training',
    organization: undefined,
    offer: OfferFactory().one(),
    existingOrganization: undefined,
    existingOffer: undefined,
  },
  {
    testLabel: 'for all organization and all trainings, with a other id already stored',
    organization: undefined,
    offer: undefined,
    existingOrganization: OrganizationFactory().one(),
    existingOffer: OfferFactory().one(),
  },
  {
    testLabel: 'for a training in an organization, with a other id already stored',
    organization: OrganizationFactory().one(),
    offer: OfferFactory().one(),
  },
  {
    testLabel: 'for an organization, with a other id already stored',
    organization: OrganizationFactory().one(),
    offer: undefined,
    existingOrganization: OrganizationFactory().one(),
    existingOffer: OfferFactory().one(),
  },
  {
    testLabel: 'for a training, with a other id already stored',
    organization: undefined,
    offer: OfferFactory().one(),
    existingOrganization: OrganizationFactory().one(),
    existingOffer: OfferFactory().one(),
  },

  {
    testLabel: 'Base testing without any other id stored',
  },
  {
    testLabel: 'Testing with a other id already stored',
    existingOrganization: OrganizationFactory().one(),
    existingOffer: OfferFactory().one(),
  },
])(
  'contractArchiveLocalStorage $testLabel',
  ({ organization, offer, existingOrganization, existingOffer }) => {
    let localStorageArchiveFilters: LocalStorageArchiveFilters;
    let localStorageExistingArchiveFilters: LocalStorageArchiveFilters;
    let exsitingContractId: string;

    beforeEach(() => {
      localStorageArchiveFilters = {
        organizationId: organization ? organization.id : undefined,
        offerId: offer ? offer.id : undefined,
      };
      localStorageExistingArchiveFilters = {
        organizationId: existingOrganization ? existingOrganization.id : undefined,
        offerId: existingOffer ? existingOffer.id : undefined,
      };
      exsitingContractId = faker.string.uuid();

      if (existingOffer && existingOrganization) {
        // everything should work fine with multiple archive stored
        storeContractArchiveId({
          ...localStorageExistingArchiveFilters,
          contractArchiveId: exsitingContractId,
        });
      }
    });

    afterEach(() => {
      unstoreContractArchiveId(localStorageArchiveFilters);
      unstoreContractArchiveId(localStorageExistingArchiveFilters);
    });

    it('should store and unstore contractArchiveId and creation date in localStorage', () => {
      expect(localStorage.getItem(generateLocalStorageKey(localStorageArchiveFilters))).toBeNull();

      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId({ ...localStorageArchiveFilters, contractArchiveId });
      expect(localStorage.getItem(generateLocalStorageKey(localStorageArchiveFilters))).toMatch(
        new RegExp(`[0-9]+::${contractArchiveId}`),
      );

      unstoreContractArchiveId(localStorageArchiveFilters);
      expect(localStorage.getItem(generateLocalStorageKey(localStorageArchiveFilters))).toBeNull();
    });

    it('should retrieve contractArchiveId from localStorage', () => {
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId({ ...localStorageArchiveFilters, contractArchiveId });

      const retrievedcontractArchiveId = getStoredContractArchiveId(localStorageArchiveFilters);
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
        storeContractArchiveId({ ...localStorageArchiveFilters, contractArchiveId });

        jest.setSystemTime(new Date(now));
        expect(isStoredContractArchiveIdExpired(localStorageArchiveFilters)).toBe(true);

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
      storeContractArchiveId({ ...localStorageArchiveFilters, contractArchiveId });

      jest.setSystemTime(new Date(now));
      expect(isStoredContractArchiveIdExpired(localStorageArchiveFilters)).toBe(false);

      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
  },
);
