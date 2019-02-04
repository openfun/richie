import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { modelName } from '../../types/models';
import { Search } from '../Search/Search';

const mapDispatchToProps = {
  requestCategories: partial(getResourceList, modelName.CATEGORIES, {
    limit: 999,
  }),
  requestOrganizations: partial(getResourceList, modelName.ORGANIZATIONS, {
    limit: 999,
  }),
};

export const SearchContainer = connect(
  null,
  mapDispatchToProps,
)(Search);
