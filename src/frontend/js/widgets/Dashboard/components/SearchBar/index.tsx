import { Button, Input } from '@openfun/cunningham-react';
import { MouseEvent, PropsWithChildren, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { Nullable } from 'types/utils';

const messages = defineMessages({
  searchPlaceholder: {
    defaultMessage: 'Search',
    description: 'Placeholder of the dashboard search bar',
    id: 'Dashboard.components.SearchBar.searchPlaceholder',
  },
  searchButtonLabel: {
    defaultMessage: 'Search',
    description: 'Label of the dashboard search bar submit button',
    id: 'Dashboard.components.SearchBar.searchButtonLabel',
  },
  clearSearchButtonLabel: {
    defaultMessage: 'clear current research',
    description: 'Label of the dashboard search bar clear button',
    id: 'Dashboard.components.SearchBar.clearSearchButtonLabel',
  },
});

interface SearchBarProps {
  onSubmit: (query: Nullable<string>) => void;
}

const SearchBar = ({ onSubmit }: SearchBarProps) => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('query') || '').trim();
  const [innerQuery, setInnerQuery] = useState<string>(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOnSubmit = (event: MouseEvent<HTMLButtonElement> & MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onSubmit(innerQuery.trim() || null);
  };
  const clear = (event: MouseEvent<HTMLButtonElement> & MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();

    setInnerQuery('');
    onSubmit(null);

    event.currentTarget.blur();
    inputRef?.current?.blur();
  };
  return (
    <form className="dashboard-search-bar">
      <Input
        ref={inputRef}
        label={intl.formatMessage(messages.searchPlaceholder)}
        value={innerQuery}
        onChange={(e) => setInnerQuery(e.target.value)}
        rightIcon={
          query && (
            <Button
              className="dashboard-search-bar__input"
              type="button"
              size="small"
              color="tertiary"
              icon={<span className="material-icons">close</span>}
              onClick={clear}
              aria-label={intl.formatMessage(messages.clearSearchButtonLabel)}
            />
          )
        }
        tabIndex={0}
      />

      <Button
        className="dashboard-search-bar__input"
        type="submit"
        icon={<span className="material-icons">search</span>}
        onClick={handleOnSubmit}
        tabIndex={0}
        aria-label={intl.formatMessage(messages.searchButtonLabel)}
      />
    </form>
  );
};

SearchBar.Container = ({ children }: PropsWithChildren) => {
  return <div className="dashboard-search-bar__container">{children}</div>;
};

export default SearchBar;
