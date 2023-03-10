import { useRef, useState } from 'react';

import { defineMessages, useIntl } from 'react-intl';
import { FilterDefinition, StaticFilterDefinitions } from 'types/filters';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'hooks/useAsyncEffect';

// Our search and autosuggestion pipeline operated based on filter definitions. Obviously, we can't filters
// courses by courses, but we still need a filter-definition-like config to run courses autocompletion.
const coursesConfig: FilterDefinition = {
  base_path: null,
  human_name: 'Courses',
  is_autocompletable: true,
  is_searchable: true,
  name: 'courses',
  position: 99,
};

const messages = defineMessages({
  courses: {
    defaultMessage: 'Courses',
    description: 'localized human_name label for coursesConfig filter name',
    id: 'components.useStaticFilters.courses',
  },
});

/**
 * Hook to provide static filter definitions to components as a promise while abstracting away
 * data-fetching & caching logic.
 * @param includeCoursesConfig Whether to include the courses filter-like configuration in the resulting definitions.
 * @returns A getter function that returns a promise which will be resolved with the static filter definitions.
 */
export const useStaticFilters = (includeCoursesConfig = false) => {
  const [needsFilters, setNeedsFilters] = useState(false);
  const intl = useIntl();

  const filtersResolver = useRef<Nullable<(filters: StaticFilterDefinitions) => void>>(null);
  const [filtersPromise] = useState<Promise<StaticFilterDefinitions>>(
    () => new Promise((resolve) => (filtersResolver.current = resolve)),
  );

  useAsyncEffect(async () => {
    if (needsFilters) {
      const response = await fetch('/api/v1.0/filter-definitions/');
      if (!response.ok) {
        throw new Error('Failed to get filter definitions.');
      }

      const filters = await response.json();

      filtersResolver.current!({
        ...filters,
        ...(includeCoursesConfig
          ? {
              courses: {
                ...coursesConfig,
                human_name: intl.formatMessage(messages.courses),
              },
            }
          : {}),
      });
    }
  }, [needsFilters]);

  return () => {
    setNeedsFilters(true);
    return filtersPromise!;
  };
};
