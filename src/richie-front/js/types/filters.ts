import { FormattedMessage } from 'react-intl';

export type hardcodedFilterGroupName = 'availability' | 'language' | 'new';

export type resourceBasedFilterGroupName = 'organizations' | 'subjects';

export type filterGroupName =
  | resourceBasedFilterGroupName
  | hardcodedFilterGroupName;

export interface FilterValue {
  primaryKey: string; // Either a machine name or a stringified ID
  humanName: FormattedMessage.MessageDescriptor | string;
  count?: number; // TODO: Replace Maybe<number> with number when all the facets are available
}

export interface FilterDefinition {
  humanName: FormattedMessage.MessageDescriptor;
  machineName: filterGroupName;
  isDrilldown?: boolean;
}

export interface FilterDefinitionWithValues extends FilterDefinition {
  values: FilterValue[];
}
