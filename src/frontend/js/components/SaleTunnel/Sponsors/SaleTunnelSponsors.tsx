import { defineMessages, FormattedMessage } from 'react-intl';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import {
  DashboardAvatar,
  DashboardAvatarVariantEnum,
} from 'widgets/Dashboard/components/DashboardAvatar';
import { Organization } from 'types/Joanie';

const messages = defineMessages({
  blockTitle: {
    id: 'components.SaleTunnel.Sponsors.SaleTunnelSponsors.blockTitle',
    defaultMessage: 'University',
    description: 'Title for the universities section in the sale tunnel',
  },
});

export const SaleTunnelSponsors = () => {
  const {
    props: { organizations },
  } = useSaleTunnelContext();

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className="block-title">
        <FormattedMessage {...messages.blockTitle} />
      </h3>
      <div className="sale-tunnel__sponsors">{organizations?.map(OrganizationLogo)}</div>
    </>
  );
};

const OrganizationLogo = (organization: Organization) => {
  if (organization.logo) {
    return <img key={organization.id} src={organization.logo!.src} alt={organization.title} />;
  }

  return (
    <DashboardAvatar
      key={organization.id}
      title={organization.title}
      variant={DashboardAvatarVariantEnum.SQUARE}
    />
  );
};
