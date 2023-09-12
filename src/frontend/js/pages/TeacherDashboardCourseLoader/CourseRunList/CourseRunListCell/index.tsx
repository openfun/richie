import c from 'classnames';
import { PropsWithChildren } from 'react';
import { Icon, IconTypeEnum } from 'components/Icon';

enum CellContentVariant {
  DEFAULT = 'default',
  SMALL = 'small',
  ALIGN_RIGHT = 'align-right',
}

interface CellProps extends PropsWithChildren {
  iconType?: IconTypeEnum;
  textContent?: string;
  maxWidth?: number;
  variant?: CellContentVariant;
}

const CourseRunListCell = ({
  iconType,
  textContent,
  maxWidth,
  variant = CellContentVariant.DEFAULT,
  children,
}: CellProps) => {
  return (
    <div
      className={c('teacher-dashboard-course-run-list__cell', {
        variant__small: variant === CellContentVariant.SMALL,
        'variant__justify-right': variant === CellContentVariant.ALIGN_RIGHT,
        'variant__content-ellipsis': maxWidth !== undefined,
      })}
      title={textContent}
    >
      {iconType && (
        <Icon className="teacher-dashboard-course-run-list__cell__icon" name={iconType} />
      )}
      <div
        className="teacher-dashboard-course-run-list__cell__content"
        style={
          maxWidth
            ? {
                maxWidth: `${maxWidth}px`,
              }
            : undefined
        }
      >
        {textContent || children}
      </div>
    </div>
  );
};

CourseRunListCell.SMALL = CellContentVariant.SMALL;
CourseRunListCell.ALIGN_RIGHT = CellContentVariant.ALIGN_RIGHT;

export default CourseRunListCell;
