export type hardcodedFilterGroupName = 'language' | 'new' | 'status';

export type resourceBasedFilterGroupName = 'organizations' | 'subjects';

export type filterGroupName =
  | resourceBasedFilterGroupName
  | hardcodedFilterGroupName;

export interface FilterValue {
  primaryKey: string; // Either a machine name or a stringified ID
  humanName: string;
  count?: number; // TODO: Replace Maybe<number> with number when all the facets are available
}

export interface FilterDefinition {
  humanName: string;
  machineName: filterGroupName;
  isDrilldown?: boolean;
  values: FilterValue[];
}
