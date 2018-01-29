import { Observable } from 'rxjs/Observable';
import '../../utils/observable/extensions';

import { FilterDefinition } from '../../types/FilterDefinition';
import organizationsResp from '../../fixtures/organizations';
import subjectsResp from '../../fixtures/subjects';

// Define hardcoded filters
// Wrap them in Observable so we can combine them with the async ones
const languagesFilter$: Observable<FilterDefinition> = Observable.of({
  human_name: 'Language',
  machine_name: 'language',
  values: [
    [ 'en', 'English' ],
    [ 'fr', 'French' ],
  ],
});

const newFilter$: Observable<FilterDefinition> = Observable.of({
  human_name: 'New courses',
  machine_name: 'status',
  values: [
    [ 'new', 'First session' ],
  ],
});

const statusFilter$: Observable<FilterDefinition> = Observable.of({
  human_name: 'Availability',
  is_drilldown: true,
  machine_name: 'availability',
  values: [
    [ 'coming_soon', 'Coming soon' ],
    [ 'current', 'Current session' ],
    [ 'open', 'Open, no session' ]
  ],
});

// Define filters that depend on API data
// NB: they're loading from JS fixtures until we do implement the API
const organizationsFilter$: Observable<FilterDefinition> = Observable.of({
  human_name: 'Organization',
  machine_name: 'organization',
})
.switchMap((orgFilterData) => {
  return Observable.of(organizationsResp)
  .map((response) => {
    return {
      ...orgFilterData,
      values: response.results.map((organization) => {
        return [ organization.code, organization.name ];
      }),
    };
  });
});

const subjectsFilter$: Observable<FilterDefinition> = Observable.of({
  human_name: 'subjects',
  machine_name: 'Subjects',
})
.switchMap((subjectFilterData) => {
  return Observable.of(subjectsResp)
  .map((response) => {
    return {
      ...subjectFilterData,
      values: response.results.map((subject) => {
        return [ subject.code, subject.name ];
      }),
    };
  });
});

// Combine the filters together so the consumer gets a nice static output
// NB: This array defines the filters order in the UI
const filters$ = Observable.combineLatest([
  newFilter$,
  statusFilter$,
  subjectsFilter$,
  organizationsFilter$,
  languagesFilter$,
])
.share();

export default filters$;