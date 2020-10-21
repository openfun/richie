import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, MessageDescriptor } from 'react-intl';
import ReactModal from 'react-modal';

import { fetchList } from 'data/getResourceList';
import { CourseSearchParamsAction, useCourseSearchParams } from 'data/useCourseSearchParams';
import { RequestStatus } from 'types/api';
import { FacetedFilterDefinition, FilterValue } from 'types/filters';
import { Nullable } from 'utils/types';
import { useAsyncEffect } from 'utils/useAsyncEffect';

interface SearchFilterGroupModalProps {
  filter: FacetedFilterDefinition;
}

const messages = defineMessages({
  closeButton: {
    defaultMessage: 'Close',
    description: 'Text for the button to close the search filters modal',
    id: 'components.SearchFilterGroupModal.closeModal',
  },
  error: {
    defaultMessage: 'There was an error while searching for {filterName}.',
    description:
      'Error message when the search for more filter value fails in the search filters modal.',
    id: 'components.SearchFilterGroupModal.error',
  },
  modalTitle: {
    defaultMessage: 'Add filters for {filterName}',
    description: 'Title for the modal to add more filter values in the search filters modal.',
    id: 'components.SearchFilterGroupModal.modalTitle',
  },
  moreOptionsButton: {
    defaultMessage: 'More options',
    description:
      'Test for the button to see more filter values than the top N that appear by default.',
    id: 'components.SearchFilterGroupModal.moreOptionsButton',
  },
  queryTooShort: {
    defaultMessage: 'Type at least 3 characters to start searching.',
    description:
      'Users need to enter at least 3 characters to search for more filter values; this message informs them when they start typing.',
    id: 'components.SearchFilterGroupModal.queryTooShort',
  },
});

// The `setAppElement` needs to happen in proper code but breaks our testing environment.
// This workaround is not satisfactory but it allows us to both test <SearchFilterGroupModal />
// and avoid compromising accessibility in real-world use.
const isTestEnv = typeof jest !== 'undefined';
if (!isTestEnv) {
  ReactModal.setAppElement('#modal-exclude');
}

export const SearchFilterGroupModal = ({ filter }: SearchFilterGroupModalProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [values, setValues] = useState([] as FilterValue[]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null as Nullable<MessageDescriptor>);

  // We need the current course search params to get the facet counts
  const { courseSearchParams, dispatchCourseSearchParamsUpdate } = useCourseSearchParams();

  // When the modal is closed, reset state so the user gets a brand-new one if they come back
  useEffect(() => {
    if (!modalIsOpen) {
      setValues([]);
      setQuery('');
      setError(null);
    }
  }, [modalIsOpen]);

  useAsyncEffect(async () => {
    // We can't start using full-text search until our text query is at least 3 characters long.
    if (!modalIsOpen || (query.length > 0 && query.length < 3)) {
      return;
    }

    const searchResponse = await fetchList(filter.name, {
      limit: '20',
      offset: '0',
      query,
    });

    if (searchResponse.status === RequestStatus.FAILURE) {
      setValues([]);
      return setError(messages.error);
    }

    const facetResponse = await fetchList('courses', {
      ...courseSearchParams,
      [`${filter.name}_include`]: `(${searchResponse.content.objects
        .map((resource) => resource.id)
        .join('|')})`,
      scope: 'filters',
    });

    if (facetResponse.status === RequestStatus.FAILURE) {
      setValues([]);
      return setError(messages.error);
    }

    const newValues = facetResponse.content.filters[filter.name].values;

    setError(null);
    setValues(newValues);
  }, [modalIsOpen, query]);

  return (
    <React.Fragment>
      <button className="search-filter-group-modal-button" onClick={() => setModalIsOpen(true)}>
        <FormattedMessage {...messages.moreOptionsButton} />
      </button>
      <ReactModal
        ariaHideApp={!isTestEnv}
        bodyOpenClassName="has-search-filter-group-modal"
        className="search-filter-group-modal"
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        overlayClassName="search-filter-group-modal__overlay"
      >
        <fieldset className="search-filter-group-modal__form">
          <legend className="search-filter-group-modal__form__title">
            <FormattedMessage {...messages.modalTitle} values={{ filterName: filter.human_name }} />
          </legend>
          <input
            aria-label="Search for filters to add"
            className="search-filter-group-modal__form__input"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={`Search in ${filter.human_name}`}
          />
          {error ? (
            <div className="search-filter-group-modal__form__error">
              <FormattedMessage {...messages.error} values={{ filterName: filter.human_name }} />
            </div>
          ) : query.length > 0 && query.length < 3 ? (
            <div className="search-filter-group-modal__form__error">
              <FormattedMessage {...messages.queryTooShort} />
            </div>
          ) : (
            <ul className="search-filter-group-modal__form__values">
              {values.map((value) => (
                <li className="search-filter-group-modal__form__values__item" key={value.key}>
                  <button
                    onClick={() => {
                      dispatchCourseSearchParamsUpdate({
                        filter,
                        payload: value.key,
                        type: CourseSearchParamsAction.filterAdd,
                      });
                      setModalIsOpen(false);
                    }}
                  >
                    {value.human_name}&nbsp;
                    {value.count || value.count === 0 ? `(${value.count})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <button className="search-filter-group-modal__close" onClick={() => setModalIsOpen(false)}>
          <FormattedMessage {...messages.closeButton} />
        </button>
      </ReactModal>
    </React.Fragment>
  );
};
