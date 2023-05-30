import { Link } from 'react-router-dom';
import { FunctionComponent, ReactElement } from 'react';

interface CourseLinkProps {
  href?: string;
  to?: string;
  tabIndex?: number;
  className?: string;
  children?: ReactElement;
}

const CourseLink: FunctionComponent<CourseLinkProps> = ({
  href,
  to,
  className,
  tabIndex,
  children = null,
}) => {
  if (href) {
    return (
      <a href={href} className={className} tabIndex={tabIndex}>
        {children}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={className} tabIndex={tabIndex}>
        {children}
      </Link>
    );
  }

  return children;
};

export default CourseLink;
