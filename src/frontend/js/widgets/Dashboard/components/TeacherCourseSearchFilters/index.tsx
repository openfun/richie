import { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import querystring from 'query-string';
import { CourseStatusFilter, CourseTypeFilter, TeacherCourseSearchFilters } from 'hooks/useCourses';
import { SelectField } from 'components/Form';

const messages = defineMessages({
  filterStatusPrepend: {
    defaultMessage: 'Status:',
    description: 'Option prepend label for courses search filters',
    id: 'components.TeacherCourseSearchFiltersBar.status.option.label.prepend',
  },
  filterStatusAll: {
    defaultMessage: 'All',
    description: 'Option label for all courses statuses in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.status.option.label.all',
  },
  filterIncoming: {
    defaultMessage: 'Incoming',
    description: 'Option label for courses status incoming in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.status.option.label.incoming',
  },
  filterOngoing: {
    defaultMessage: 'Ongoing',
    description: 'Option label for courses status ongoing in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.status.option.label.ongoing',
  },
  filterArchived: {
    defaultMessage: 'Archived',
    description: 'Option label for courses status archived in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.status.option.label.archived',
  },
  filterTypePrepend: {
    defaultMessage: 'Training type:',
    description: 'Option prepend label for courses search filters',
    id: 'components.TeacherCourseSearchFiltersBar.type.option.label.prepend',
  },
  filterTypeAll: {
    defaultMessage: 'All',
    description: 'Option prepend label for courses training types in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.type.option.label.all',
  },
  filterCourseRun: {
    defaultMessage: 'Course run',
    description: 'Option label for courses run training type in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.type.option.label.courseRun',
  },
  filterMicroCredential: {
    defaultMessage: 'Micro credential',
    description: 'Option label for courses micro credential training type in search filters',
    id: 'components.TeacherCourseSearchFiltersBar.type.option.label.microCredential',
  },
});

interface SearchFilterOptionProps {
  value: string;
  prependLabel: string;
  label: string;
}
const SearchFilterOption = ({ value, prependLabel, label }: SearchFilterOptionProps) => (
  <option value={value}>{`${prependLabel} ${label}`}</option>
);

export interface TeacherCourseSearchFiltersBarProps {
  filters: TeacherCourseSearchFilters;
}

const TeacherCourseSearchFiltersBar = ({ filters }: TeacherCourseSearchFiltersBarProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const statusOptions = [
    {
      label: intl.formatMessage(messages.filterIncoming),
      value: CourseStatusFilter.INCOMING,
    },
    {
      label: intl.formatMessage(messages.filterOngoing),
      value: CourseStatusFilter.ONGOING,
    },
    {
      label: intl.formatMessage(messages.filterArchived),
      value: CourseStatusFilter.ARCHIVED,
    },
  ];
  const typeOptions = [
    {
      label: intl.formatMessage(messages.filterCourseRun),
      value: CourseTypeFilter.SESSION,
    },
    {
      label: intl.formatMessage(messages.filterMicroCredential),
      value: CourseTypeFilter.MIRCO_CREDENTIAL,
    },
  ];

  const onChangeFilter = (e: ChangeEvent<HTMLSelectElement>) => {
    const {
      target: { name, value },
    } = e;

    navigate(`?${querystring.stringify({ ...filters, [name]: value })}`, { replace: true });
  };

  return (
    <div className="dashboard-course-search-filters">
      <SelectField
        fieldClasses={['dashboard-course-search-filters__filter_select']}
        name="status"
        id="course_search_filter_status"
        value={filters.status}
        onChange={onChangeFilter}
      >
        <option value={CourseStatusFilter.ALL} key={`option_status_${CourseStatusFilter.ALL}`}>
          <FormattedMessage {...messages.filterStatusPrepend} />{' '}
          <FormattedMessage {...messages.filterStatusAll} />
        </option>
        {statusOptions.map(({ label, value }) => (
          <SearchFilterOption
            key={`option_status_${value}`}
            label={label}
            prependLabel={intl.formatMessage(messages.filterTypePrepend)}
            value={value}
          />
        ))}
      </SelectField>
      <SelectField
        fieldClasses={['dashboard-course-search-filters__filter_select']}
        name="type"
        id="course_search_filter_type"
        value={filters.type}
        onChange={onChangeFilter}
      >
        <option value={CourseTypeFilter.ALL} key={`option_type_${CourseStatusFilter.ALL}`}>
          <FormattedMessage {...messages.filterTypePrepend} />{' '}
          <FormattedMessage {...messages.filterTypeAll} />
        </option>
        {typeOptions.map(({ label, value }) => (
          <SearchFilterOption
            key={`option_type_${value}`}
            label={label}
            prependLabel={intl.formatMessage(messages.filterTypePrepend)}
            value={value}
          />
        ))}
      </SelectField>
    </div>
  );
};

export default TeacherCourseSearchFiltersBar;
