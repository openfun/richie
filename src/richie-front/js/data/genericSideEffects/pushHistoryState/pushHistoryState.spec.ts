import { pushState } from './pushHistoryState';

describe('data/genericSideEffects/pushHistoryState saga', () => {
  describe('pushState', () => {
    it('calls history.pushState with the action contents', () => {
      const windo: any = {
        history: { pushState: jasmine.createSpy('history.pushState') },
      };
      pushState(windo, {
        state: null,
        title: '',
        type: 'HISTORY_PUSH_STATE',
        url: 'some_url',
      });

      expect(windo.history.pushState).toHaveBeenCalledWith(
        null,
        '',
        'some_url',
      );
    });
  });
});
