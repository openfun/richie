import { useSaleTunnelV2Context } from 'components/SaleTunnelV2/GenericSaleTunnel';

export const SaleTunnelSponsors = () => {
  const {
    props: { organizations },
  } = useSaleTunnelV2Context();
  return (
    <div className="sale-tunnel__sponsors">
      {organizations
        ?.filter((organization) => organization.logo)
        .map((organization) => (
          <img key={organization.id} src={organization.logo!.src} alt={organization.title} />
        ))}
    </div>
  );
};
