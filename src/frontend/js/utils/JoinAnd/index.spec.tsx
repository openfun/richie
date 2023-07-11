import { createIntl } from 'react-intl';
import { joinAnd } from 'utils/JoinAnd/index';

describe('JoinAnd', () => {
  it('handles empty array', () => {
    const intl = createIntl({ locale: 'en' });
    expect(joinAnd([], intl)).toEqual('');
  });
  it('handles array with 1 element', () => {
    const intl = createIntl({ locale: 'en' });
    expect(joinAnd(['A'], intl)).toEqual('A');
  });
  it('handles array with 2 elements', () => {
    const intl = createIntl({ locale: 'en' });
    expect(joinAnd(['A', 'B'], intl)).toEqual('A and B');
  });
  it('handles array with >2 elements', () => {
    const intl = createIntl({ locale: 'en' });
    expect(joinAnd(['A', 'B', 'C'], intl)).toEqual('A, B and C');
  });
  it('handles custom separator', () => {
    const intl = createIntl({ locale: 'en' });
    expect(joinAnd(['A', 'B', 'C'], intl, '+ ')).toEqual('A+ B and C');
  });
});
