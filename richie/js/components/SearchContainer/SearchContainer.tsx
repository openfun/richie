import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { Search } from '../Search/Search';

const mapDispatchToProps = {
  requestOrganizations: partial(getResourceList, 'organizations', {
    limit: 999,
  }),
  requestSubjects: partial(getResourceList, 'subjects', { limit: 999 }),
};

export const SearchContainer = connect(
  null,
  mapDispatchToProps,
)(Search);
