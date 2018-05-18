// Some of our filters are hardcoded and do not rely on any external data
const hardcodedFilterDefinitions = {
  language: {
    humanName: 'Language',
    machineName: 'language' as 'language',
    values: [
      { primaryKey: 'en', humanName: 'English' },
      { primaryKey: 'fr', humanName: 'French' },
    ],
  },

  new: {
    humanName: 'New courses',
    machineName: 'new' as 'new',
    values: [{ primaryKey: 'new', humanName: 'First session' }],
  },

  status: {
    humanName: 'Availability',
    isDrilldown: true,
    machineName: 'status' as 'status',
    values: [
      { primaryKey: 'coming_soon', humanName: 'Coming soon' },
      { primaryKey: 'current', humanName: 'Current session' },
      { primaryKey: 'open', humanName: 'Open, no session' },
    ],
  },
};

const resourceBasedFilterDefinitions = {
  organizations: {
    humanName: 'Organizations',
    machineName: 'organizations' as 'organizations',
  },

  subjects: {
    humanName: 'Subjects',
    machineName: 'subjects' as 'subjects',
  },
};

export const initialState = {
  ...hardcodedFilterDefinitions,
  ...resourceBasedFilterDefinitions,
};

export default initialState;
