interface IconProps {
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
}

// icons from src/richie/apps/core/templates/richie/icons.html
export type IconType =
  | 'icon-calendar'
  | 'icon-barcode'
  | 'icon-chevron-down'
  | 'icon-clock'
  | 'icon-pace'
  | 'icon-duration'
  | 'icon-cross'
  | 'icon-envelope'
  | 'icon-facebook'
  | 'icon-filter'
  | 'icon-linkedin'
  | 'icon-login'
  | 'icon-magnifying-glass'
  | 'icon-org'
  | 'icon-quote'
  | 'icon-search-fail'
  | 'icon-stopwatch'
  | 'icon-twitter'
  | 'icon-arrow-right'
  | 'icon-check'
  | 'icon-info-rounded'
  | 'icon-warning';

export const Icon = ({ name, title, className = '' }: IconProps) => {
  return (
    <svg
      className={`icon ${className}`}
      aria-hidden={title ? undefined : true}
      {...(title && {
        role: 'img',
        'aria-label': title,
      })}
    >
      {title && <title>{title}</title>}
      <use href={`#${name}`} />
    </svg>
  );
};
