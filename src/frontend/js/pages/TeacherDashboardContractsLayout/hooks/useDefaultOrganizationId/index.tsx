import { useParams, useSearchParams } from 'react-router-dom';
import { useOrganizations } from 'hooks/useOrganizations';
import { Organization } from 'types/Joanie';

/**
 * return organization id with this priority:
 * * route param
 * * query param
 * * first organization of user's organizations
 */
const useDefaultOrganizationId = () => {
  const { organizationId: routeOrganizationId } = useParams<{
    organizationId?: Organization['id'];
  }>();
  const [searchParams] = useSearchParams();
  const queryOrganizationId = searchParams.get('organization_id') || undefined;
  const { items: organizations } = useOrganizations(undefined, {
    enabled: !routeOrganizationId && !queryOrganizationId,
  });

  return (
    routeOrganizationId ||
    queryOrganizationId ||
    (organizations.length > 0 ? organizations[0].id : undefined)
  );
};

export default useDefaultOrganizationId;
