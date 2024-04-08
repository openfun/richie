import { faker } from '@faker-js/faker';
import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import { CourseProductRelationFactory, OrganizationFactory } from 'utils/test/factories/joanie';
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
    courseProductRelation: undefined,
  },
  {
    testLabel: 'for a training in an organization',
    organization: OrganizationFactory().one(),
    courseProductRelation: CourseProductRelationFactory().one(),
  },
  {
    testLabel: 'for an organization',
    organization: OrganizationFactory().one(),
    courseProductRelation: undefined,
  },
  {
    testLabel: 'for a training',
    organization: undefined,
    courseProductRelation: CourseProductRelationFactory().one(),
  },
])('contractArchiveLocalStorage $testLabel', ({ organization, courseProductRelation }) => {
  let localStorageArchiveFilters: LocalStorageArchiveFilters;

  beforeEach(() => {
    localStorageArchiveFilters = {
      organizationId: organization ? organization.id : undefined,
      courseProductRelationId: courseProductRelation ? courseProductRelation.id : undefined,
    };

    // everything should work fine with multiple archive stored
    storeContractArchiveId({
      organizationId: OrganizationFactory().one().id,
      courseProductRelationId: CourseProductRelationFactory().one().id,
      contractArchiveId: faker.string.uuid(),
    });
  });

  afterEach(() => {
    unstoreContractArchiveId(localStorageArchiveFilters);
  });

  describe.each([
    {
      testLabel: 'Base testing without any other id stored',
    },
    {
      testLabel: 'Testing with a other id already stored',
      existingOrganization: OrganizationFactory().one(),
      existingCourseProductRelation: CourseProductRelationFactory().one(),
    },
  ])('$testLabel', ({ existingOrganization, existingCourseProductRelation }) => {
    let localStorageExistingArchiveFilters: LocalStorageArchiveFilters;
    let exsitingContractId: string;

    beforeEach(() => {
      localStorageExistingArchiveFilters = {
        organizationId: existingOrganization ? existingOrganization.id : undefined,
        courseProductRelationId: existingCourseProductRelation
          ? existingCourseProductRelation.id
          : undefined,
      };
      exsitingContractId = faker.string.uuid();

      if (existingCourseProductRelation && existingOrganization) {
        // everything should work fine with multiple archive stored
        storeContractArchiveId({
          ...localStorageExistingArchiveFilters,
          contractArchiveId: exsitingContractId,
        });
      }
    });

    afterEach(() => {
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
  });
});
