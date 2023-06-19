import c from 'classnames';

export enum DashboardAvatarVariantEnum {
  DEFAULT = 'default',
  SQUARE = 'square',
}

interface DashboardAvatarProps {
  title: string;
  imageUrl?: string;
  variant?: DashboardAvatarVariantEnum;
}

export const DashboardAvatar = ({
  title,
  imageUrl,
  variant = DashboardAvatarVariantEnum.DEFAULT,
}: DashboardAvatarProps) => {
  const letter = title.charAt(0).toUpperCase();
  return (
    <div
      data-testid="dashboard-avatar"
      className={c('dashboard__avatar', {
        'dashboard__avatar--square': variant === DashboardAvatarVariantEnum.SQUARE,
      })}
    >
      {imageUrl ? <img src={imageUrl} alt={title} /> : letter}
    </div>
  );
};
