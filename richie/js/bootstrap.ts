import configureStore from './data/configureStore';
import organizations from './fixtures/organizations';
import subjects from './fixtures/subjects';

export default function bootstrapStore() {
  return configureStore({
    resources: {
      organization: {
        byId: organizations.results.reduce((acc, organization) => {
          return {
            ...acc,
            [organization.id]: organization,
          };
        }, {}),
      },
      subject: {
        byId: subjects.results.reduce((acc, subject) => {
          return {
            ...acc,
            [subject.id]: subject,
          };
        }, {}),
      },
    },
  });
}
