export interface FilterValue {
  count: number;
  human_name: string;
  key: string;
}

export interface FilterDefinition {
  human_name: string;
  is_drilldown?: boolean;
  name: string;
  values: FilterValue[];
}
