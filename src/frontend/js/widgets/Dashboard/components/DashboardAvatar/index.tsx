import c from 'classnames';
import { JoanieFile } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { Nullable } from 'types/utils';

export enum DashboardAvatarVariantEnum {
  DEFAULT = 'default',
  SQUARE = 'square',
}

export interface DashboardAvatarProps {
  title: string;
  image?: Nullable<JoanieFile>;
  variant?: DashboardAvatarVariantEnum;
  backgroundColor?: string;
}

export const DashboardAvatar = ({
  title,
  image,
  backgroundColor,
  variant = DashboardAvatarVariantEnum.DEFAULT,
}: DashboardAvatarProps) => {
  return (
    <div
      data-testid="dashboard-avatar"
      className={c('dashboard__avatar', {
        'dashboard__avatar--square': variant === DashboardAvatarVariantEnum.SQUARE,
      })}
      style={{ backgroundColor }}
    >
      {image ? (
        <img
          className="dashboard__avatar__image"
          src={image.src}
          srcSet={image.srcset}
          alt={title}
        />
      ) : (
        <span className="dashboard__avatar__letter">{StringHelper.abbreviate(title, 3)}</span>
      )}
    </div>
  );
};
