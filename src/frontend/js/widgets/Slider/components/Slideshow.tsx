import { defineMessages, useIntl } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Slide as SlideType } from '../types';
import Slide from './Slide';

const messages = defineMessages({
  nextSlide: {
    id: 'widgets.Slider.components.Slideshow.nextSlide',
    defaultMessage: 'Next slide',
    description: 'Aria label to navigate to the next slide.',
  },
  previousSlide: {
    id: 'widgets.Slider.components.Slideshow.previousSlide',
    defaultMessage: 'Previous slide',
    description: 'Aria label to navigate to the previous slide.',
  },
});
type SlideshowProps = {
  slides: readonly SlideType[];
  onNextSlide: () => void;
  onPreviousSlide: () => void;
};

/**
 * This component is used to display the slideshow.
 * It renders the slides and the navigation buttons.
 */
const Slideshow = ({ slides, onNextSlide, onPreviousSlide }: SlideshowProps) => {
  const intl = useIntl();

  return (
    <>
      <div className="slider__slideshow">
        {slides.map((slide) => (
          <Slide key={slide.pk} slide={slide} />
        ))}
      </div>
      <div className="slider__slideshow-overlay">
        <button
          className="slider__navigation-button"
          onClick={onPreviousSlide}
          aria-label={intl.formatMessage(messages.previousSlide)}
        >
          <Icon name={IconTypeEnum.CHEVRON_LEFT_OUTLINE} aria-hidden="true" />
        </button>
        <button
          className="slider__navigation-button"
          onClick={onNextSlide}
          aria-label={intl.formatMessage(messages.nextSlide)}
        >
          <Icon name={IconTypeEnum.CHEVRON_RIGHT_OUTLINE} aria-hidden="true" />
        </button>
      </div>
    </>
  );
};

export default Slideshow;
