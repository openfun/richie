import { screen } from '@testing-library/dom';
import { render } from 'utils/test/render';
import { PresentationalAppWrapper } from 'utils/test/wrappers/PresentationalAppWrapper';
import SearchResultsCount from '.';

describe('Dashbaord/components/SearchResultsCount', () => {
  it('should render singular message', () => {
    render(<SearchResultsCount nbResults={1} />, {
      wrapper: PresentationalAppWrapper,
      routerOptions: {
        initialEntries: ['/?query=test+query'],
      },
    });
    const $text = screen.getByText('1 result matching your search');
    expect($text).toBeInTheDocument();
    expect($text).not.toHaveClass('list__count-description--no-results');
  });

  it('should render plural message', () => {
    render(<SearchResultsCount nbResults={10} />, {
      wrapper: PresentationalAppWrapper,
      routerOptions: {
        initialEntries: ['/?query=test+query'],
      },
    });
    const $text = screen.getByText('10 results matching your search');
    expect($text).toBeInTheDocument();
    expect($text).not.toHaveClass('list__count-description--no-results');
  });

  it.each([0, undefined])(
    'should render with visibility hidden when nbResults is %s',
    (nbResults) => {
      render(<SearchResultsCount nbResults={nbResults} />, {
        wrapper: PresentationalAppWrapper,
        routerOptions: {
          initialEntries: ['/?query=test+query'],
        },
      });
      const $text = screen.getByTestId('search-results-count');
      expect($text).toBeInTheDocument();
      expect($text).toHaveClass('list__count-description--no-results');
    },
  );

  it('should render with visibility hidden when no research is active', () => {
    render(<SearchResultsCount nbResults={undefined} />, {
      wrapper: PresentationalAppWrapper,
      routerOptions: {
        initialEntries: ['/'],
      },
    });
    const $text = screen.getByTestId('search-results-count');
    expect($text).toBeInTheDocument();
    expect($text).toHaveClass('list__count-description--no-results');
  });
});
