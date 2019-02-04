import { FormattedMessage } from 'react-intl';
import { modelName } from './models';

export type hardcodedFilterGroupName = 'availability' | 'language' | 'new';

export type resourceBasedFilterGroupName =
  | modelName.ORGANIZATIONS
  | modelName.CATEGORIES;

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
