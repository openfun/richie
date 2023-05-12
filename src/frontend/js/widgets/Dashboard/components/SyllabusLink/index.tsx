import { PropsWithChildren } from 'react';
import c from 'classnames';
import { Icon, IconTypeEnum } from 'components/Icon';

interface SyllabusLinkProps extends PropsWithChildren {
  href: string;
  className?: string;
}

const SyllabusLink = ({ href, className, children }: SyllabusLinkProps) => (
  <a className={c('syllabus-link', className)} href={href}>
    <Icon name={IconTypeEnum.LOGOUT_SQUARE} />
    <span>{children}</span>
  </a>
);

export default SyllabusLink;
