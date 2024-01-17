import { useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { createSearchParams, useParams } from 'react-router-dom';
import Badge from 'components/Badge';
import { Spinner } from 'components/Spinner';
import { useOrganization } from 'hooks/useOrganizations';
import { ContractState } from 'types/Joanie';
import { DashboardSidebar, MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import useTeacherPendingContractsCount from 'hooks/useTeacherPendingContractsCount';
import useContractAbilities from 'hooks/useContractAbilities';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import { DashboardAvatar, DashboardAvatarVariantEnum } from '../DashboardAvatar';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherDashboardOrganizationSidebar.subHeader',
    description: 'Sub title of the organization dashboard sidebar',
    defaultMessage: 'You are on the organization dashboard',
  },
  loading: {
    defaultMessage: 'Loading organization...',
    description: 'Message displayed while loading an organization',
    id: 'components.TeacherDashboardOrganizationSidebar.loading',
  },
});

export const TeacherDashboardOrganizationSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const { organizationId, courseProductRelationId } = useParams<{
    organizationId: string;
    courseProductRelationId?: string;
  }>();
  const {
    item: organization,
    states: { fetching },
  } = useOrganization(organizationId);

  const { contracts: pendingContracts, pendingContractCount } = useTeacherPendingContractsCount({
    organizationId,
    courseProductRelationId,
  });
  const contractAbilities = useContractAbilities(pendingContracts);
  const canSignContracts = contractAbilities.can(ContractActions.SIGN);

  const getMenuLinkFromPath = (basePath: TeacherDashboardPaths) => {
    const path = getRoutePath(basePath, { organizationId });

    const menuLink: MenuLink = {
      to: path,
      label: getRouteLabel(basePath),
    };

    // For the contracts link, we want to display the number of contracts if needed and set
    // the correct filter depending on the user's abilities
    if (basePath === TeacherDashboardPaths.ORGANIZATION_CONTRACTS) {
      if (canSignContracts && pendingContractCount > 0) {
        const searchParams = createSearchParams({ signature_state: ContractState.LEARNER_SIGNED });
        menuLink.badge = <Badge color="primary">{pendingContractCount}</Badge>;
        menuLink.to = `${path}?${searchParams.toString()}`;
      } else {
        const searchParams = createSearchParams({ signature_state: ContractState.SIGNED });
        menuLink.to = `${path}?${searchParams.toString()}`;
      }
    }

    return menuLink;
  };

  const links = useMemo(
    () =>
      [
        TeacherDashboardPaths.ORGANIZATION_COURSES,
        TeacherDashboardPaths.ORGANIZATION_CONTRACTS,
      ].map(getMenuLinkFromPath),
    [pendingContractCount, canSignContracts],
  );

  if (fetching) {
    return (
      <Spinner aria-labelledby="loading-courses-data">
        <span id="loading-courses-data">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  return (
    <DashboardSidebar
      menuLinks={links}
      header={organization.title}
      subHeader={intl.formatMessage(messages.subHeader)}
      avatar={
        <DashboardAvatar
          title={organization.title}
          variant={DashboardAvatarVariantEnum.SQUARE}
          image={organization.logo}
        />
      }
    />
  );
};
