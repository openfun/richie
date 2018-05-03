import { Reducer } from 'redux';

import { courses, CoursesState } from './courses/reducer';
import { filterDefinitions, FilterDefinitionState } from './filterDefinitions/reducer';
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
    filterDefinitions: filterDefinitions(state.filterDefinitions, action),
    resources: {
      courses: courses(state.resources.courses, action),
      organizations: organizations(state.resources.organizations, action),
      subjects: subjects(state.resources.subjects, action),
    },
  };
};

export default rootReducer;
