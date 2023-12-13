import c from 'classnames';
import { JoanieFile } from 'types/Joanie';
import { Nullable } from 'types/utils';

export enum DashboardAvatarVariantEnum {
  DEFAULT = 'default',
  SQUARE = 'square',
}

interface DashboardAvatarProps {
  title: string;
  image?: Nullable<JoanieFile>;
  variant?: DashboardAvatarVariantEnum;
}

export const DashboardAvatar = ({
  title,
  image,
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
      {image ? <img src={image.src} srcSet={image.srcset} alt={title} /> : letter}
    </div>
  );
};
