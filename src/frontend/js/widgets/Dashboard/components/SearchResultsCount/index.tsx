import classNames from 'classnames';
import { FormattedMessage, defineMessages } from 'react-intl';
import { useSearchParams } from 'react-router-dom';

const messages = defineMessages({
  searchCountText: {
    defaultMessage:
      '{nbResults} {nbResults, plural, one {result} other {results}} matching your search',
    description: 'Text to indicate the total number of results for a research',
    id: 'Dashboard.components.SearchResultsCount.searchCountText',
  },
});

interface SearchResultsCountProps {
  nbResults?: number;
}

const SearchResultsCount = ({ nbResults }: SearchResultsCountProps) => {
  const [searchParams] = useSearchParams();
  return (
    <div
      className={classNames('list__count-description', {
        'list__count-description--no-results': !searchParams.get('query') || !nbResults,
      })}
      data-testid="search-results-count"
    >
      <FormattedMessage {...messages.searchCountText} values={{ nbResults }} />
    </div>
  );
};

export default SearchResultsCount;
