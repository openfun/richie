import { Nullable } from 'utils/types';

/**
 * Filter values are specific choices that are available for a given filter, eg. `Mathematics` and `Social sciences`
 * for `Subjects`.
 * @property `count` — Faceted count of matching results for the filter value, given the current search parameters.
 * @property `human_name` — Internationalized human name for the filter value.
 * @property `key` — ID for the filter. This is the MPTT path of the CMS page for this filter value, prefixed with
 * `P-` if it has children, or with `L-` otherwise.
 */
export interface FilterValue {
  count: number;
  human_name: string;
  key: string;
}

/**
 * Filter definitions give us information on a type of filter, eg. `organizations`, `availabilities`
 * @property `base_path` — MPTT path of the CMS page that matches the filter. This is useful here because
 * it appears in the path the pages for all filter values that are under that filter in the taxonomy.
 * @property `has_more_values` — Whether or not there are other values besides those in the `values` array
 * in the present response.
 * @property `human_name` — Internationalized human name for the filter.
 * @property `is_autocompletable` — whether the filter has an associated API endpoint for autocompletion.
 * @property `is_drilldown` — Whether the filter is limited to one active value at a time.
 * @property `is_searchable` — whether the filter has an associated API endpoint for full-text search.
 * @property `name` — Machine name for the filter (for use in API calls, query strings, etc.).
 * @property `values` — List of (faceted) available values for the filter.
 */
export interface FilterDefinition {
  base_path: Nullable<string>;
  has_more_values: boolean;
  human_name: string;
  is_autocompletable: boolean;
  is_drilldown?: boolean;
  is_searchable: boolean;
  name: string;
  values: FilterValue[];
}
