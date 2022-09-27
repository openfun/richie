import { PropsWithTestId } from 'types/utils';

type Props = PropsWithTestId<{
  name: IconType;
  /**
   * Optional title, will be announced by screen readers
   * and set as `title` attribute for mouse users
   *
   * If omitted, the icon is considered decorative and
   * ignored by screen readers
   */
  title?: string;
  className?: string;
}>;

// icons from src/richie/apps/core/templates/richie/icons.html
export type IconType =
  | 'icon-arrow-right'
  | 'icon-barcode'
  | 'icon-calendar'
  | 'icon-certificate'
  | 'icon-check'
  | 'icon-checklist'
  | 'icon-chevron-down'
  | 'icon-chevron-down-outline'
  | 'icon-clock'
  | 'icon-creditCard'
  | 'icon-cross'
  | 'icon-duration'
  | 'icon-envelope'
  | 'icon-facebook'
  | 'icon-filter'
  | 'icon-info-rounded'
  | 'icon-linkedin'
  | 'icon-login'
  | 'icon-magnifying-glass'
  | 'icon-org'
  | 'icon-pace'
  | 'icon-plus'
  | 'icon-quote'
  | 'icon-round-close'
  | 'icon-school'
  | 'icon-search-fail'
  | 'icon-stopwatch'
  | 'icon-three-vertical-dots'
  | 'icon-twitter'
  | 'icon-warning';

export const Icon = ({ name, title, className = '', ...props }: Props) => {
  return (
    <svg
      className={`icon ${className}`}
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
