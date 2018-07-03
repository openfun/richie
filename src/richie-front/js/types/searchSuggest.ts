import { FormattedMessage } from 'react-intl';

import { Course } from './Course';
import { modelNameList } from './models';
import { Organization } from './Organization';
import { Resource } from './Resource';
import { Subject } from './Subject';

interface ResourceSuggestion<M extends modelNameList, T extends Resource> {
  model: M;
  data: T;
}

export type CourseSuggestion = ResourceSuggestion<'courses', Course>;
export type OrganizationSuggestion = ResourceSuggestion<
  'organizations',
  Organization
>;
export type SubjectSuggestion = ResourceSuggestion<'subjects', Subject>;

export type SearchSuggestion =
  | CourseSuggestion
  | OrganizationSuggestion
  | SubjectSuggestion;

interface ResourceSuggestionSection<
  M extends modelNameList,
  T extends Resource
> {
  message: FormattedMessage.MessageDescriptor;
  model: M;
  values: T[];
}

export type CourseSuggestionSection = ResourceSuggestionSection<
  'courses',
  Course
>;
export type OrganizationSuggestionSection = ResourceSuggestionSection<
  'organizations',
  Organization
>;
export type SubjectSuggestionSection = ResourceSuggestionSection<
  'subjects',
  Subject
>;

export type SearchSuggestionSection =
  | CourseSuggestionSection
  | OrganizationSuggestionSection
  | SubjectSuggestionSection;
