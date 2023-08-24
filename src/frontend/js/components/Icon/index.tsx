import { PropsWithTestId } from 'types/utils';

export type IconSize = 'small' | 'medium' | 'large';

type Props = PropsWithTestId<{
  name: IconTypeEnum;
  /**
   * Optional title, will be announced by screen readers
   * and set as `title` attribute for mouse users
   *
   * If omitted, the icon is considered decorative and
   * ignored by screen readers
   */
  title?: string;
  className?: string;
  size?: IconSize;
}>;

// icons from src/richie/apps/core/templates/richie/icons.html
export enum IconTypeEnum {
  ARCHIVE = 'icon-archive',
  ARROW_RIGHT = 'icon-arrow-right',
  ARROW_RIGHT_ROUNDED = 'icon-arrow-right-rounded',
  BARCODE = 'icon-barcode',
  CAL = 'icon-cal',
  CALENDAR = 'icon-calendar',
  CAMERA = 'icon-camera',
  CERTIFICATE = 'icon-certificate',
  CHECK = 'icon-check',
  CHECK_ROUNDED = 'icon-check-rounded',
  CHECKLIST = 'icon-checklist',
  CHEVRON_DOWN = 'icon-chevron-down',
  CHEVRON_DOWN_OUTLINE = 'icon-chevron-down-outline',
  CHEVRON_LEFT_OUTLINE = 'icon-chevron-left-outline',
  CHEVRON_RIGHT_OUTLINE = 'icon-chevron-right-outline',
  CHEVRON_UP_OUTLINE = 'icon-chevron-up-outline',
  CLOCK = 'icon-clock',
  CREDIT_CARD = 'icon-creditCard',
  CROSS = 'icon-cross',
  DURATION = 'icon-duration',
  ENVELOPE = 'icon-envelope',
  FACEBOOK = 'icon-facebook',
  FILTER = 'icon-filter',
  GROUPS = 'icon-groups',
  INFO_ROUNDED = 'icon-info-rounded',
  LANGUAGES = 'icon-languages',
  LINKEDIN = 'icon-linkedin',
  LOGIN = 'icon-login',
  LOGOUT_SQUARE = 'icon-logout-square',
  MAGNIFYING_GLASS = 'icon-magnifying-glass',
  MENU = 'icon-menu',
  MORE = 'icon-more',
  ORG = 'icon-org',
  PACE = 'icon-pace',
  PLUS = 'icon-plus',
  QUOTE = 'icon-quote',
  ROUND_CLOSE = 'icon-round-close',
  SCHOOL = 'icon-school',
  SEARCH_FAIL = 'icon-search-fail',
  STOPWATCH = 'icon-stopwatch',
  THREE_VERTICAL_DOTS = 'icon-three-vertical-dots',
  TWITTER = 'icon-twitter',
  UNIVERSITY = 'icon-univerity',
  WARNING = 'icon-warning',
}

export const Icon = ({ name, title, className = '', size = 'medium', ...props }: Props) => {
  return (
    <svg
      className={`icon icon--${size} ${className}`}
      aria-hidden={title ? undefined : true}
      {...(title && {
        role: 'img',
        'aria-label': title,
      })}
      {...props}
    >
      {title && <title>{title}</title>}
      <use href={`#${name}`} />
    </svg>
  );
};
