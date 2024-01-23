import classNames from 'classnames';
import { PropsWithChildren } from 'react/ts5.0';

type BadgeProps = PropsWithChildren<{
  color?: 'primary' | 'secondary' | 'tertiary';
}>;
const Badge = ({ children, color }: BadgeProps) => (
  <div
    data-testid="badge"
    className={classNames('category-badge', {
      [`category-badge--${color}`]: Boolean(color),
    })}
  >
    <span className="category-badge__title">{children}</span>
  </div>
);

export default Badge;
