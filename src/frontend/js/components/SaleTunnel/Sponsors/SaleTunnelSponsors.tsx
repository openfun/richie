import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';

export const SaleTunnelSponsors = () => {
  const {
    props: { organizations },
  } = useSaleTunnelContext();
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
