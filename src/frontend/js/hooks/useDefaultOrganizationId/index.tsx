import { useParams, useSearchParams } from 'react-router';
import { useOrganizations } from 'hooks/useOrganizations';
import { Offer, Organization } from 'types/Joanie';

/**
 * return organization id with this priority:
 * * route param
 * * query param
 * * first organization of user's organizations
 */
const useDefaultOrganizationId = () => {
  const { organizationId: routeOrganizationId, offerId: routeOfferId } = useParams<{
    organizationId?: Organization['id'];
    offerId: Offer['id'];
  }>();
  const [searchParams] = useSearchParams();
  const queryOrganizationId = searchParams.get('organization_id') || undefined;
  const { items: organizations } = useOrganizations(
    { offer_id: routeOfferId },
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
