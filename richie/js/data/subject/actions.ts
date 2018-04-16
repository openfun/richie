import Subject from '../../types/Subject';
import { ResourceAdd } from '../genericReducers/resourceById/actions';

export function addSubject(subject: Subject): ResourceAdd<Subject> {
  return {
    resource: subject,
    resourceName: 'subject',
    type: 'RESOURCE_ADD',
  };
}
