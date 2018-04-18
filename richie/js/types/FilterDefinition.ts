export interface FilterValue {
  primaryKey: string; // Either a machine name or a stringified ID
  humanName: string;
  count?: number; // TODO: Replace Maybe<number> with number when all the facets are available
}
export interface FilterDefinition {
  humanName: string;
  machineName: string;
  isDrilldown?: boolean;
  values: FilterValue[];
}
