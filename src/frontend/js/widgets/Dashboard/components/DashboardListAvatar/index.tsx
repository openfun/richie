import { DashboardAvatar, DashboardAvatarProps } from '../DashboardAvatar';

const DashboardListAvatar = (props: DashboardAvatarProps) => {
  return (
    <div className="dashboard-list-avatar__container">
      <DashboardAvatar {...props} />
    </div>
  );
};

export default DashboardListAvatar;
