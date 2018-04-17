import configureStore from './data/configureStore';

export default function bootstrapStore() {
  return configureStore({
    resources: {},
  });
}
