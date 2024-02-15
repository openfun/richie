import { CourseOrderResourceQuery, Organization } from 'types/Joanie';
import FilterOrganization from 'widgets/Dashboard/components/FilterOrganization';
import FiltersBar from 'widgets/Dashboard/components/FiltersBar';

export interface CourseLearnersFiltersBarProps {
  defaultValues?: CourseOrderResourceQuery;
  onFiltersChange: (filters: Partial<CourseOrderResourceQuery>) => void;
  organizationList: Organization[];
  hideFilterOrganization?: boolean;
}
const CourseLearnersFiltersBar = ({
  defaultValues,
  onFiltersChange,
  organizationList,
  hideFilterOrganization,
}: CourseLearnersFiltersBarProps) => {
  return (
    !hideFilterOrganization && (
      <FiltersBar>
        <FilterOrganization
          defaultValue={defaultValues?.organization_id}
          organizationList={organizationList}
          onChange={onFiltersChange}
          clearable={true}
        />
      </FiltersBar>
    )
  );
};

export default CourseLearnersFiltersBar;
