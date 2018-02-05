export default interface FilterDefinition {
  human_name: string,
  machine_name: string,
  is_drilldown?: boolean,
  values: string[][],
}
