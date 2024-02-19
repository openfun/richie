import { StringHelper } from 'utils/StringHelper';
import { DashboardAvatar, DashboardAvatarProps } from '../DashboardAvatar';

interface DashboardListAvatarProps extends DashboardAvatarProps {
  saturation?: number;
  lightness?: number;
}

const DashboardListAvatar = ({
  saturation,
  lightness,
  ...avatarProps
}: DashboardListAvatarProps) => {
  const backgroundColor = StringHelper.toColor(avatarProps.title, saturation, lightness);
  return (
    <div className="dashboard-list-avatar__container">
      <DashboardAvatar {...avatarProps} backgroundColor={backgroundColor} />
    </div>
  );
};

export default DashboardListAvatar;
