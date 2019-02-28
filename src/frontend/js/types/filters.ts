export interface FilterValue {
  count: number;
  human_name: string;
  key: string; // Either a machine name or a stringified ID
}

export interface FilterDefinition {
  human_name: string;
  is_drilldown?: boolean;
  name: string;
  values: FilterValue[];
}
