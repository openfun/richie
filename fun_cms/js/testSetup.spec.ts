import { configure } from 'enzyme';
// NB: this breaks the spec, but is necessary as 'enzyme-adapter-react-16' uses a non-compatible
// export pattern that prevents us from using either a default or a named import.
// https://github.com/airbnb/enzyme/issues/1293
import * as Adapter from 'enzyme-adapter-react-16';

// Enzyme requires this imperative configuration bit to be run before any test
configure({ adapter: new Adapter() });
