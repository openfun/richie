import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';

const messages = defineMessages({
  enrollmentManagement: {
    id: 'batchOrder.enrollmentManagement.title',
    description: 'Title for enrollment management section',
    defaultMessage: 'Enrollment',
  },
  enrolledStudents: {
    id: 'batchOrder.enrollmentManagement.enrolledStudents',
    description: 'Title for enrolled students section',
    defaultMessage: 'Enrolled Students',
  },
  availableVouchers: {
    id: 'batchOrder.enrollmentManagement.availableVouchers',
    description: 'Title for available vouchers section',
    defaultMessage: 'Available Vouchers',
  },
  previous: {
    id: 'batchOrder.enrollmentManagement.previous',
    description: 'Button to go to previous page',
    defaultMessage: 'Previous',
  },
  next: {
    id: 'batchOrder.enrollmentManagement.next',
    description: 'Button to go to next page',
    defaultMessage: 'Next',
  },
});

// Mockup: Hardcoded data
const MOCK_ENROLLED_STUDENTS = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont' },
  { id: '2', firstName: 'Marie', lastName: 'Martin' },
  { id: '3', firstName: 'Pierre', lastName: 'Durand' },
  { id: '4', firstName: 'Sophie', lastName: 'Bernard' },
  { id: '5', firstName: 'Luc', lastName: 'Petit' },
  { id: '6', firstName: 'Julie', lastName: 'Robert' },
  { id: '7', firstName: 'Thomas', lastName: 'Richard' },
  { id: '8', firstName: 'Emma', lastName: 'Simon' },
  { id: '9', firstName: 'Nicolas', lastName: 'Laurent' },
];

const MOCK_AVAILABLE_VOUCHERS = [
  'A7K9-2XPQ-8M4N',
  'B3R5-7YWL-1C6H',
  'D9F2-4KTG-5V8J',
  'E6M8-3ZNP-9Q2R',
  'F1L4-6XBW-7S3D',
  'G8H5-2VCK-4T9M',
  'J3N7-9RFP-1W6L',
  'K5Q2-8YHG-3X4B',
  'M7T4-1ZDJ-6P9N',
];

const TOTAL_SEATS = 12;
const ITEMS_PER_PAGE = 10;

export const EnrollmentManagementSubItem = () => {
  const intl = useIntl();
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [studentsPage, setStudentsPage] = useState(0);
  const [vouchersPage, setVouchersPage] = useState(0);

  const enrolledCount = MOCK_ENROLLED_STUDENTS.length;
  const vouchersCount = MOCK_AVAILABLE_VOUCHERS.length;

  const totalStudentsPages = Math.ceil(enrolledCount / ITEMS_PER_PAGE);
  const displayedStudents = MOCK_ENROLLED_STUDENTS.slice(
    studentsPage * ITEMS_PER_PAGE,
    (studentsPage + 1) * ITEMS_PER_PAGE,
  );

  const totalVouchersPages = Math.ceil(vouchersCount / ITEMS_PER_PAGE);
  const displayedVouchers = MOCK_AVAILABLE_VOUCHERS.slice(
    vouchersPage * ITEMS_PER_PAGE,
    (vouchersPage + 1) * ITEMS_PER_PAGE,
  );

  return (
    <DashboardSubItem
      title={intl.formatMessage(messages.enrollmentManagement)}
      footer={
        <div className="content">
          {/* Progress Bar */}
          <div className="enrollment-progress">
            <span className="dashboard-item__label">
              {enrolledCount}/{TOTAL_SEATS}
            </span>
            <div className="enrollment-progress__bar">
              <div
                className="enrollment-progress__bar__fill"
                style={{ width: `${(enrolledCount / TOTAL_SEATS) * 100}%` }}
              />
            </div>
          </div>

          {/* Enrolled Students Collapsible Section */}
          <div className="enrollment-nested-section">
            <button
              className="enrollment-nested-section__toggle"
              onClick={() => setStudentsOpen(!studentsOpen)}
              type="button"
            >
              <Icon
                name={studentsOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE}
                size="small"
              />
              <span className="dashboard-item__label">
                <FormattedMessage {...messages.enrolledStudents} /> ({enrolledCount})
              </span>
            </button>
            {studentsOpen && (
              <div className="enrollment-nested-section__content">
                {displayedStudents.map((student) => (
                  <div key={student.id}>
                    {student.firstName} {student.lastName}
                  </div>
                ))}
                {totalStudentsPages > 1 && (
                  <div className="enrollment-pagination">
                    <button
                      type="button"
                      className="enrollment-pagination__button"
                      onClick={() => setStudentsPage(studentsPage - 1)}
                      disabled={studentsPage === 0}
                    >
                      <FormattedMessage {...messages.previous} />
                    </button>
                    <span className="enrollment-pagination__info">
                      {studentsPage + 1} / {totalStudentsPages}
                    </span>
                    <button
                      type="button"
                      className="enrollment-pagination__button"
                      onClick={() => setStudentsPage(studentsPage + 1)}
                      disabled={studentsPage >= totalStudentsPages - 1}
                    >
                      <FormattedMessage {...messages.next} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Available Vouchers Collapsible Section */}
          <div className="enrollment-nested-section">
            <button
              className="enrollment-nested-section__toggle"
              onClick={() => setVouchersOpen(!vouchersOpen)}
              type="button"
            >
              <Icon
                name={vouchersOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE}
                size="small"
              />
              <span className="dashboard-item__label">
                <FormattedMessage {...messages.availableVouchers} /> ({vouchersCount})
              </span>
            </button>
            {vouchersOpen && (
              <div className="enrollment-nested-section__content">
                {displayedVouchers.map((voucher) => (
                  <div key={voucher}>{voucher}</div>
                ))}
                {totalVouchersPages > 1 && (
                  <div className="enrollment-pagination">
                    <button
                      type="button"
                      className="enrollment-pagination__button"
                      onClick={() => setVouchersPage(vouchersPage - 1)}
                      disabled={vouchersPage === 0}
                    >
                      <FormattedMessage {...messages.previous} />
                    </button>
                    <span className="enrollment-pagination__info">
                      {vouchersPage + 1} / {totalVouchersPages}
                    </span>
                    <button
                      type="button"
                      className="enrollment-pagination__button"
                      onClick={() => setVouchersPage(vouchersPage + 1)}
                      disabled={vouchersPage >= totalVouchersPages - 1}
                    >
                      <FormattedMessage {...messages.next} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};
