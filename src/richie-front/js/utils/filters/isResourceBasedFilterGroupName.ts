import includes from 'lodash-es/includes';

import { FILTERS_RESOURCES } from '../../settings';
import {
  filterGroupName,
  resourceBasedFilterGroupName,
} from '../../types/filters';

export function isResourceBasedFilterGroupName(
  name: filterGroupName,
): name is resourceBasedFilterGroupName {
  return includes(Object.keys(FILTERS_RESOURCES), name);
}
