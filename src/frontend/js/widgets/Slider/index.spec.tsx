import { screen, fireEvent, render, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import useEmblaCarousel from 'embla-carousel-react';
import { Slide } from './types';
import Slider from '.';

// Mock the embla-carousel-react hook
jest.mock('embla-carousel-react', () => {
  const mockEmblaApi = {
    scrollTo: jest.fn(),
    scrollNext: jest.fn(),
    scrollPrev: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    selectedScrollSnap: jest.fn(),
  };

  return () => [
    jest.fn(), // ref
    mockEmblaApi,
  ];
});

const mockUseEmblaCarousel = useEmblaCarousel as jest.Mocked<typeof useEmblaCarousel>;

describe('<Slider />', () => {
  const mockSlides: Slide[] = [
    {
      pk: '1',
      title: 'Slide 1',
      content: 'Content 1',
      image: 'image1.jpg',
      link_url: 'https://example.com/1',
      link_open_blank: false,
    },
    {
      pk: '2',
      title: 'Slide 2',
      content: 'Content 2',
      image: 'image2.jpg',
      link_url: 'https://example.com/2',
      link_open_blank: false,
    },
    {
      pk: '3',
      title: 'Slide 3',
      content: 'Content 3',
      image: 'image3.jpg',
      link_url: 'https://example.com/3',
      link_open_blank: false,
    },
  ];

  const defaultProps = {
    pk: '1',
    title: 'Test Slider',
    slides: mockSlides,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the slider with all slides', () => {
    render(
      <IntlProvider locale="en">
        <Slider {...defaultProps} />
      </IntlProvider>,
    );

    // Check if all slides are rendered
    mockSlides.forEach((slide) => {
      expect(screen.getByRole('img', { name: slide.title })).toBeInTheDocument();
      // Check if the link is rendered
      const link = screen.queryByRole('link', { name: slide.title });
      if (slide.link_url) {
        expect(link).toHaveAttribute('href', slide.link_url);
        expect(link).toBeInTheDocument();
      } else {
        expect(link).not.toBeInTheDocument();
      }
    });

    // Check if navigation elements are present
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();

    // Only the active slide content should be visible
    const activeSlide = screen.getByRole('group', { name: /Slide 1:.*/ });
    expect(activeSlide).toBeInTheDocument();
    within(activeSlide).getByText(mockSlides[0].title);
    within(activeSlide).getByText(mockSlides[0].content);
    expect(screen.queryByRole('group', { name: /Slide 2:.*/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Slide 3:.*/ })).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    const mockEmblaApi = mockUseEmblaCarousel()[1]!;
    render(
      <IntlProvider locale="en">
        <Slider {...defaultProps} />
      </IntlProvider>,
    );

    const slider = screen.getByRole('button', { name: /test slider/i });

    // Test arrow key navigation
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(mockEmblaApi.scrollPrev).toHaveBeenNthCalledWith(1);

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(mockEmblaApi.scrollNext).toHaveBeenNthCalledWith(1);

    // Test home/end key navigation
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(mockEmblaApi.scrollTo).toHaveBeenNthCalledWith(1, 0);

    fireEvent.keyDown(slider, { key: 'End' });
    expect(mockEmblaApi.scrollTo).toHaveBeenNthCalledWith(2, mockSlides.length - 1);
  });

  it('provides accessible navigation controls', () => {
    render(
      <IntlProvider locale="en">
        <Slider {...defaultProps} />
      </IntlProvider>,
    );

    // Check if navigation buttons are properly labeled
    expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveAttribute(
      'aria-label',
      'Previous slide',
    );
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveAttribute(
      'aria-label',
      'Next slide',
    );

    // Check if slider has proper ARIA attributes
    const slider = screen.getByRole('button', { name: defaultProps.title });
    expect(slider).toHaveAttribute('aria-roledescription', 'carousel');
    const presentation = screen.getByRole('presentation');
    expect(presentation).toBeInTheDocument();
    expect(presentation).toHaveAttribute('aria-live', 'polite');
    expect(presentation).toHaveAttribute('aria-atomic', 'true');
    expect(presentation).toHaveTextContent(/Slide 1 of 3:.*/);
  });

  it('renders bullets navigation', () => {
    render(
      <IntlProvider locale="en">
        <Slider {...defaultProps} />
      </IntlProvider>,
    );

    const bullets = screen.getAllByRole('tab', { name: /Go to slide [1-3]{1}/ });
    expect(bullets).toHaveLength(mockSlides.length);

    expect(bullets[0]).toHaveAttribute('aria-selected', 'true');
    expect(bullets[1]).toHaveAttribute('aria-selected', 'false');
    expect(bullets[2]).toHaveAttribute('aria-selected', 'false');

    // Click the second bullet
    fireEvent.click(bullets[1]);
    expect(mockUseEmblaCarousel()[1]!.scrollTo).toHaveBeenCalledWith(1);
  });
});
