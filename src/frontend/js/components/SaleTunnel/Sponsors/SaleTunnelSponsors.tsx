import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { DashboardAvatar } from 'widgets/Dashboard/components/DashboardAvatar';

export const SaleTunnelSponsors = () => {
  const {
    props: { organizations },
  } = useSaleTunnelContext();
  return (
    <div className="sale-tunnel__sponsors">
      {organizations?.map((organization) => {
        if (organization.logo) {
          return (
            <img key={organization.id} src={organization.logo!.src} alt={organization.title} />
          );
        }
        return <DashboardAvatar key={organization.id} title={organization.title} />;
      })}
    </div>
  );
};
