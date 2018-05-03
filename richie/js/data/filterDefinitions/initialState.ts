// Some of our filters are hardcoded and do not rely on any external data
const hardcodedFilterDefinitions = {
  language: {
    humanName: 'Language',
    machineName: 'language',
    values: [
      { primaryKey: 'en', humanName: 'English' },
      { primaryKey: 'fr', humanName: 'French' },
    ],
  },

  new: {
    humanName: 'New courses',
    machineName: 'status',
    values: [
      { primaryKey: 'new', humanName: 'First session'},
    ],
  },

  status: {
    humanName: 'Availability',
    isDrilldown: true,
    machineName: 'availability',
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
    machineName: 'organizations',
  },

  subjects: {
    humanName: 'Subjects',
    machineName: 'subjects',
  },
};

export const initialState = { ...hardcodedFilterDefinitions, ...resourceBasedFilterDefinitions };

export default initialState;
