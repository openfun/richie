import Subject from '../../types/Subject';

export interface SubjectAdd {
  subject: Subject;
  type: 'SUBJECT_ADD';
}

export function addSubject(subject: Subject): SubjectAdd {
  return {
    subject,
    type: 'SUBJECT_ADD',
  };
}
