export interface FilterDefinition {
  human_name: string,
  machine_name: string,
  is_singlefaceted?: boolean,
  values: string[][],
}
