import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { useInfiniteQuery } from 'react-query';

import { Modal } from 'components/Modal';
import { Spinner } from 'components/Spinner';
import { Icon } from 'components/Icon';
import { fetchList } from 'data/getResourceList';
import { CourseSearchParamsAction, useCourseSearchParams } from 'data/useCourseSearchParams';
import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { RequestStatus } from 'types/api';
import { FacetedFilterDefinition } from 'types/filters';
import { Nullable } from 'types/utils';
import { matchMedia } from 'utils/indirection/window';
import { useIntersectionObserver } from 'utils/useIntersectionObserver';

const messages = defineMessages({
  closeButton: {
    defaultMessage: 'Close modal',
    description: 'Text for the button to close the search filters modal',
    id: 'components.SearchFilterGroupModal.closeModal',
  },
  error: {
    defaultMessage: 'There was an error while searching for {filterName}.',
    description:
      'Error message when the search for more filter value fails in the search filters modal.',
    id: 'components.SearchFilterGroupModal.error',
  },
  inputLabel: {
    defaultMessage: 'Search for filters to add',
    description: 'Accessible label for the search input in the search filter modal.',
    id: 'components.SearchFilterGroupModal.inputLabel',
  },
  inputPlaceholder: {
    defaultMessage: 'Search in { filterName }',
    description: 'Placeholder message for the search input in the search filter modal.',
    id: 'components.SearchFilterGroupModal.inputPlaceholder',
  },
  loadingResults: {
    defaultMessage: 'Loading search results...',
    description: 'Loading message while loading more results in the search filter modal.',
    id: 'components.SearchFilterGroupModal.loadingResults',
  },
  loadMoreResults: {
    defaultMessage: 'Load more results',
    description: 'Button to manually load more results for the current active filter',
    id: 'components.SearchFilterGroupModal.loadMoreResults',
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

interface ModalContentProps {
  filter: FacetedFilterDefinition;
  modalIsOpen: boolean;
  setModalIsOpen: (newState: boolean) => void;
}

const ModalContent = ({ filter, modalIsOpen, setModalIsOpen }: ModalContentProps) => {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null as Nullable<MessageDescriptor>);

  // When the modal is closed, reset state so the user gets a brand-new one if they come back
  useEffect(() => {
    if (!modalIsOpen) {
      setQuery('');
      setError(null);
    }
  }, [modalIsOpen]);

  // We need the current course search params to get the facet counts
  const { courseSearchParams, dispatchCourseSearchParamsUpdate } = useCourseSearchParams();

  const fetchResults = async (args: any) => {
    const { pageParam, queryKey } = args;
    const [filterName, fetchCourseSearchParams, fetchQuery] = queryKey;
    const searchResponse = await fetchList(filterName, {
      ...(pageParam || API_LIST_DEFAULT_PARAMS),
      ...(fetchQuery ? { query: fetchQuery } : {}),
    });

    if (searchResponse.status === RequestStatus.FAILURE) {
      return setError(messages.error);
    }

    const facetResponse = await fetchList('courses', {
      ...fetchCourseSearchParams,
      [`${filterName}_aggs`]: searchResponse.content.objects.map((resource) => resource.id),
      scope: 'filters',
      facet_sorting: 'name',
    });

    if (facetResponse.status === RequestStatus.FAILURE) {
      return setError(messages.error);
    }

    return {
      meta: searchResponse.content.meta,
      objects: facetResponse.content.filters[filterName].values,
    };
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery(
    [filter.name, courseSearchParams, query.length > 2 ? query : ''],
    fetchResults,
    {
      enabled: modalIsOpen,
      getNextPageParam: (lastPage) => {
        if (!lastPage) {
          return undefined;
        }
        const newOffset = lastPage.meta.offset + lastPage.meta.count;
        if (newOffset >= lastPage.meta.total_count) {
          return undefined;
        }
        return { limit: API_LIST_DEFAULT_PARAMS.limit, offset: newOffset };
      },
    },
  );

  const searchInputRef = useRef<Nullable<HTMLInputElement>>(null);
  useEffect(() => {
    // When the modal opens, if on desktop, focus the search input
    if (modalIsOpen && matchMedia('(min-width: 992px)').matches) {
      searchInputRef.current?.focus();
    }
  }, [modalIsOpen]);

  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: fetchNextPage,
    enabled: !!hasNextPage,
  });

  return (
    <Fragment>
      <button
        className="modal__closeButton search-filter-group-modal__close"
        onClick={() => setModalIsOpen(false)}
      >
        <span className="offscreen">
          <FormattedMessage {...messages.closeButton} />
        </span>
        <Icon
          name="icon-cross"
          className="modal__closeButton__icon search-filter-group-modal__close__icon"
        />
      </button>
      <fieldset className="search-filter-group-modal__form">
        <legend className="search-filter-group-modal__form__title">
          <FormattedMessage {...messages.modalTitle} values={{ filterName: filter.human_name }} />
        </legend>
        <input
          aria-label={intl.formatMessage(messages.inputLabel)}
          className="search-filter-group-modal__form__input"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={intl.formatMessage(messages.inputPlaceholder, {
            filterName: filter.human_name,
          })}
          ref={searchInputRef}
        />
        {error ? (
          <div className="search-filter-group-modal__form__error">
            <FormattedMessage {...messages.error} values={{ filterName: filter.human_name }} />
          </div>
        ) : query.length > 0 && query.length < 3 ? (
          <div className="search-filter-group-modal__form__error">
            <FormattedMessage {...messages.queryTooShort} />
          </div>
        ) : status === 'error' ? (
          <div>
            <FormattedMessage {...messages.error} values={{ filterName: filter.human_name }} />
          </div>
        ) : ['idle', 'loading'].includes(status) ? (
          <Spinner>
            <FormattedMessage {...messages.loadingResults} />
          </Spinner>
        ) : (
          <ul className="search-filter-group-modal__form__values">
            {data!.pages.map((page, pageIndex) => (
              <Fragment key={pageIndex}>
                {page!.objects.map((value) => (
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
                      {value.human_name}&nbsp;{`(${value.count})`}
                    </button>
                  </li>
                ))}
              </Fragment>
            ))}
          </ul>
        )}
      </fieldset>
      {hasNextPage ? (
        <button
          className="search-filter-group-modal__more-results"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          ref={loadMoreButtonRef}
        >
          <FormattedMessage {...messages.loadMoreResults} />
        </button>
      ) : null}
    </Fragment>
  );
};

interface SearchFilterGroupModalProps {
  filter: FacetedFilterDefinition;
}

export const SearchFilterGroupModal = ({ filter }: SearchFilterGroupModalProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const modalExclude = useMemo(() => {
    const exclude = document.getElementById('modal-exclude');
    if (exclude) {
      return exclude;
    }
    throw new Error('Failed to get #modal-exclude to enable an accessible <ReactModal />.');
  }, []);

  return (
    <Fragment>
      <button className="search-filter-group-modal-button" onClick={() => setModalIsOpen(true)}>
        <FormattedMessage {...messages.moreOptionsButton} />
        <span className="offscreen">({filter.human_name})</span>
      </button>
      <Modal
        appElement={modalExclude}
        bodyOpenClassName="has-search-filter-group-modal"
        className="search-filter-group-modal modal--stretched"
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
      >
        <ModalContent {...{ filter, modalIsOpen, setModalIsOpen }} />
      </Modal>
    </Fragment>
  );
};
