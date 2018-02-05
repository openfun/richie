import Subject from '../../types/Subject';

export type SUBJECT_ADD = {
  subject: Subject,
  type: 'SUBJECT_ADD',
};

export function addSubject (subject: Subject): SUBJECT_ADD {
  return {
    subject,
    type: 'SUBJECT_ADD',
  };
}
