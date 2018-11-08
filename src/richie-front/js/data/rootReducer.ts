import { Reducer } from 'redux';

import { modelName } from '../types/models';
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
    [modelName.COURSES]?: CoursesState;
    [modelName.ORGANIZATIONS]?: OrganizationsState;
    [modelName.SUBJECTS]?: SubjectsState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => {
  return {
    filterDefinitions: filterDefinitions(
      (state && state.filterDefinitions) || undefined,
      action,
    ),
    resources: {
      [modelName.COURSES]: courses(
        (state && state.resources.courses) || undefined,
        action,
      ),
      [modelName.ORGANIZATIONS]: organizations(
        (state && state.resources.organizations) || undefined,
        action,
      ),
      [modelName.SUBJECTS]: subjects(
        (state && state.resources.subjects) || undefined,
        action,
      ),
    },
  };
};
