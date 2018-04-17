import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { Search } from '../search/search';

const mapDispatchToProps = {
  requestOrganizations: partial(getResourceList, 'organization', { limit: 999 }),
  requestSubjects: partial(getResourceList, 'subject', { limit: 999 }),
};

export const SearchContainer = connect(
  null,
  mapDispatchToProps,
)(Search);

export default SearchContainer;
