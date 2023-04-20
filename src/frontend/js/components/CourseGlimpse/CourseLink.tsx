import { Link } from 'react-router-dom';

interface CourseLinkProps {
  href?: string;
  to?: string;
  tabIndex?: number;
  className?: string;
  children: JSX.Element;
}

const CourseLink = ({ href, to, className, children, tabIndex }: CourseLinkProps): JSX.Element => {
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
