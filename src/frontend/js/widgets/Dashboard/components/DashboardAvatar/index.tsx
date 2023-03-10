import { User } from 'types/User';

export const DashboardAvatar = ({ user }: { user: User }) => {
  const letter = user.username.charAt(0).toUpperCase();
  return <div className="dashboard__avatar">{letter}</div>;
};
