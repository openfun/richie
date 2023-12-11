import { useContext, useMemo } from 'react';
import { useMatches } from 'react-router-dom';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { IntlHelper } from 'utils/IntlHelper';
import { DashboardBreadcrumbsContext } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { RouterButton } from '../RouterButton';

export type DashboardBreadcrumbsPlaceholders = Record<string, string>;

export interface DashboardBreadcrumbsMeta {
  placeholders: DashboardBreadcrumbsPlaceholders;
}

const messages = defineMessages({
  back: {
    id: 'components.DashboardBreadcrumbs.back',
    description: "The dashboard's breadcrumb back button's label",
    defaultMessage: 'Back',
  },
});

/**
 * Returns formatted breadcrumbs parts.
 */
const useBreadcrumbsParts = () => {
  const context = useContext(DashboardBreadcrumbsContext);
  const matches = useMatches();
  const intl = useIntl();
  return matches.reduce(
    (crumbs, match) => {
      const crumbLabel: MessageDescriptor = (match.handle as any)?.crumbLabel;
      // Make sure that the current crumbLabel formatjs values are present in placeholders to prevent
      // error throwing.

      if (crumbLabel && IntlHelper.doValuesExist(crumbLabel, context.meta.placeholders)) {
        crumbs.push({
          pathname: match.pathname,
          name: intl.formatMessage(crumbLabel, context.meta.placeholders),
        });
      }
      return crumbs;
    },
    [] as { pathname: string; name: string }[],
  );
};

export const DashboardBreadcrumbs = () => {
  const breadcrumbs = useBreadcrumbsParts();
  const backPath = useMemo(
    () =>
      breadcrumbs.length <= 1
        ? window.location.origin
        : breadcrumbs[breadcrumbs.length - 2].pathname,
    [breadcrumbs],
  );

  return (
    <ul className="dashboard-breadcrumbs" data-testid="dashboard-breadcrumbs">
      <li>
        <RouterButton
          href={backPath}
          size="nano"
          color="tertiary"
          icon={<span className="material-icons">chevron_left</span>}
        >
          <FormattedMessage {...messages.back} />
        </RouterButton>
      </li>

      {breadcrumbs.map((breadcrumb) => (
        <li key={breadcrumb.pathname}>
          <RouterButton href={breadcrumb.pathname} size="nano" color="tertiary">
            {breadcrumb.name}
          </RouterButton>
        </li>
      ))}
    </ul>
  );
};
