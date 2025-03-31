import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Slide as SlideType } from './types';
import SlidePanel from './components/SlidePanel';
import Slideshow from './components/Slideshow';

const messages = defineMessages({
  sliderSummary: {
    id: 'widgets.Slider.sliderSummary',
    defaultMessage: 'Slide {slideNumber} of {totalSlides}: {slideTitle}',
    description: 'Aria live label which summarizes the slider state.',
  },
});

type SliderProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  pk: string;
  title: string;
  slides: readonly SlideType[];
};

const Slider = ({ slides, title }: SliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [WheelGesturesPlugin()]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleBulletClick = useCallback(
    (index: number) => {
      setIsTransitioning(true);
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!emblaApi) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          emblaApi.scrollPrev();
          break;
        case 'ArrowRight':
          event.preventDefault();
          emblaApi.scrollNext();
          break;
        case 'Home':
          event.preventDefault();
          emblaApi.scrollTo(0);
          break;
        case 'End':
          event.preventDefault();
          emblaApi.scrollTo(slides.length - 1);
          break;
        default:
          break;
      }
    },
    [emblaApi, slides.length],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const handleSlidesChanged = (event: any) => {
      setIsTransitioning(true);
      setActiveSlideIndex(event.selectedScrollSnap());
    };
    emblaApi.on('select', handleSlidesChanged);

    return () => {
      emblaApi.off('select', handleSlidesChanged);
    };
  }, [emblaApi]);

  useEffect(() => {
    // Remove the transitioning class immediately after a transitioned render
    setIsTransitioning(false);
  }, [activeSlideIndex]);

  return (
    <div
      className="slider"
      ref={emblaRef}
      aria-roledescription="carousel"
      aria-label={title}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Slideshow
        slides={slides}
        onNextSlide={() => emblaApi?.scrollNext()}
        onPreviousSlide={() => emblaApi?.scrollPrev()}
      />
      <SlidePanel
        slides={slides}
        activeSlideIndex={activeSlideIndex}
        onBulletClick={handleBulletClick}
        isTransitioning={isTransitioning}
      />
      <span className="offscreen" role="presentation" aria-live="polite" aria-atomic="true">
        <FormattedMessage
          {...messages.sliderSummary}
          values={{
            slideNumber: activeSlideIndex + 1,
            totalSlides: slides.length,
            slideTitle: slides[activeSlideIndex].title,
          }}
        />
      </span>
    </div>
  );
};

export default Slider;
