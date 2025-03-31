import classNames from 'classnames';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Slide } from '../types';

const messages = defineMessages({
  goToSlide: {
    id: 'widgets.Slider.components.SlidePanel.goToSlide',
    defaultMessage: 'Go to slide {slideIndex}',
    description: 'Aria label for the bullet buttons to go to a given slide.',
  },
  slideAriaLabel: {
    id: 'widgets.Slider.components.SlidePanel.slideAriaLabel',
    defaultMessage: 'Slide {slideNumber}: {slideTitle}',
    description: 'Aria label for the current slide.',
  },
});

type SlidePanelProps = {
  slides: readonly Slide[];
  activeSlideIndex: number;
  isTransitioning: boolean;
  onBulletClick: (index: number) => void;
};

/**
 * This component is used to display the panel for the slideshow.
 * It renders the textual content of the current slide and also the bullet points.
 */
const SlidePanel = ({
  slides,
  activeSlideIndex,
  onBulletClick,
  isTransitioning,
}: SlidePanelProps) => {
  const intl = useIntl();
  const hasSlideContent = slides.some((slide) => slide.content);

  return (
    <section className="slider__panel" aria-label="Slide information">
      <div
        className={classNames('slide__content', {
          'slide__content--transitioning': isTransitioning,
        })}
        role="group"
        aria-roledescription="slide"
        aria-label={intl.formatMessage(messages.slideAriaLabel, {
          slideNumber: activeSlideIndex + 1,
          slideTitle: slides[activeSlideIndex].title,
        })}
      >
        <strong className="slide__title">
          <span>{slides[activeSlideIndex].title}</span>
        </strong>
        {hasSlideContent && (
          <div
            className="slide__description"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: slides[activeSlideIndex].content }}
          />
        )}
      </div>
      <div className="slider__bullet-list" role="tablist" aria-label="Slide navigation">
        {slides.map((slide, index) => (
          <button
            key={slide.pk}
            className={classNames('slider__bullet-item', {
              'slider__bullet-item--active': activeSlideIndex === index,
            })}
            onClick={() => onBulletClick(index)}
            role="tab"
            aria-selected={activeSlideIndex === index}
          >
            <span className="offscreen">
              <FormattedMessage {...messages.goToSlide} values={{ slideIndex: index + 1 }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SlidePanel;
