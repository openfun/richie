export default interface FilterDefinition {
  humanName: string;
  machineName: string;
  isDrilldown?: boolean;
  values: string[][];
}
