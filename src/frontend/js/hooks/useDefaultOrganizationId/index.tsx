import { useParams, useSearchParams } from 'react-router';
import { useOrganizations } from 'hooks/useOrganizations';
import { Offering, Organization } from 'types/Joanie';

/**
 * return organization id with this priority:
 * * route param
 * * query param
 * * first organization of user's organizations
 */
const useDefaultOrganizationId = () => {
  const { organizationId: routeOrganizationId, offeringId: routeOfferingId } = useParams<{
    organizationId?: Organization['id'];
    offeringId: Offering['id'];
  }>();
  const [searchParams] = useSearchParams();
  const queryOrganizationId = searchParams.get('organization_id') || undefined;
  const { items: organizations } = useOrganizations(
    { offering_id: routeOfferingId },
    {
      enabled: !routeOrganizationId && !queryOrganizationId,
    },
  );

  return (
    routeOrganizationId ||
    queryOrganizationId ||
    (organizations.length > 0 ? organizations[0].id : undefined)
  );
};

export default useDefaultOrganizationId;
