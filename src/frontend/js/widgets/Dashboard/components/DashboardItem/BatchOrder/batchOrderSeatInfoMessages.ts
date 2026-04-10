import { defineMessages } from 'react-intl';

export const batchOrderSeatInfoMessages = defineMessages({
  enrolledParticipants: {
    id: 'batchOrder.enrollmentManagement.enrolledParticipants',
    description: 'Progress label showing enrolled participants out of total seats',
    defaultMessage: '{seats_owned}/{nb_seats} enrolled participants',
  },
  searchPlaceholder: {
    id: 'batchOrder.enrollmentManagement.searchPlaceholder',
    description: 'Placeholder for the seat search input (student name or voucher)',
    defaultMessage: 'Student name',
  },
  noResults: {
    id: 'batchOrder.enrollmentManagement.noResults',
    description: 'Message shown when the student search returns no results',
    defaultMessage: 'No student matches your search.',
  },
  loadMore: {
    id: 'batchOrder.enrollmentManagement.loadMore',
    description: 'Button to load more seats',
    defaultMessage: 'Load {count} more',
  },
});
