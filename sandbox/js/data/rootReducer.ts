import { Reducer } from 'redux';

import { courses, CoursesState } from './courses/reducer';
import {
  filterDefinitions,
  FilterDefinitionState,
} from './filterDefinitions/reducer';
import { organizations, OrganizationsState } from './organizations/reducer';
import { subjects, SubjectsState } from './subjects/reducer';

export interface RootState {
  filterDefinitions: FilterDefinitionState;
  resources: {
    courses?: CoursesState;
    organizations?: OrganizationsState;
    subjects?: SubjectsState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => {
  return {
    filterDefinitions: filterDefinitions(
      (state && state.filterDefinitions) || undefined,
      action,
    ),
    resources: {
      courses: courses((state && state.resources.courses) || undefined, action),
      organizations: organizations(
        (state && state.resources.organizations) || undefined,
        action,
      ),
      subjects: subjects(
        (state && state.resources.subjects) || undefined,
        action,
      ),
    },
  };
};
