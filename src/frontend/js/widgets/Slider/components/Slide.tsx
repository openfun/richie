import { type Slide as SlideType } from '../types';

const Slide = ({ slide }: { slide: SlideType }) => (
  <div className="slider__slide">
    {slide.link_url ? (
      <a
        href={slide.link_url}
        target={slide.link_open_blank ? '_blank' : '_self'}
        rel="noopener noreferrer"
        title={`Go to ${slide.link_url}`}
      >
        <img src={slide.image} alt={slide.title} loading="lazy" />
      </a>
    ) : (
      <img src={slide.image} alt={slide.title} loading="lazy" />
    )}
  </div>
);

export default Slide;
