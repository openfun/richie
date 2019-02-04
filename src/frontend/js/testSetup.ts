import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

// Utility function to allow flushing of all outstanding (completed) promises
// Use it like this :
//    const asyncValue = someFunction();
//    await flushAllPromises();
//    expect...
export function flushAllPromises() {
  return new Promise(resolve => setImmediate(resolve));
}
