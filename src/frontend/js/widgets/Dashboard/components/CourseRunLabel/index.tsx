import { defineMessages, useIntl } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseRun } from 'types/Joanie';

const messages = defineMessages({
  courseRunLabelDate: {
    defaultMessage: 'Session from {from} to {to}',
    description: 'Message displayed as course run label displayed as dates',
    id: 'components.CourseRunLabel.courseRunLabelDate',
  },
});

export enum CourseRunLabelVariantEnum {
  TITLE = 'title',
  DATE = 'date',
}

interface CourseRunLabelProps {
  courseRun: CourseRun;
  variant?: CourseRunLabelVariantEnum;
}
const CourseRunLabel = ({
  courseRun,
  variant = CourseRunLabelVariantEnum.TITLE,
}: CourseRunLabelProps) => {
  const intl = useIntl();
  const displayedLabel = {
    [CourseRunLabelVariantEnum.TITLE]: courseRun.title,
    [CourseRunLabelVariantEnum.DATE]: intl.formatMessage(messages.courseRunLabelDate, {
      from: intl.formatDate(new Date(courseRun.start)),
      to: intl.formatDate(new Date(courseRun.end)),
    }),
  }[variant];
  return (
    <div className="course-run-label">
      <Icon name={IconTypeEnum.CAMERA} />
      {displayedLabel}
    </div>
  );
};

export default CourseRunLabel;
