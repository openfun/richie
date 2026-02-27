import { Meta, StoryObj } from '@storybook/react-webpack5';
import { IntlProvider } from 'react-intl';
import { Slide } from './types';
import Slider from '.';

const slides: Slide[] = [
  {
    pk: '1',
    title: 'Slide 1',
    content: 'Content for slide 1',
    image: '/static/course_cover_image.jpg',
    link_url: 'https://example.com/1',
    link_open_blank: true,
  },
  {
    pk: '2',
    title: 'Slide 2',
    content: 'Content for slide 2',
    image: '/static/course_cover_image.jpg',
    link_url: 'https://example.com/2',
    link_open_blank: true,
  },
  {
    pk: '3',
    title: 'Slide 3',
    content: 'Content for slide 3',
    image: '/static/course_cover_image.jpg',
    link_url: 'https://example.com/3',
    link_open_blank: true,
  },
];

export default {
  component: Slider,
  title: 'Widgets/Slider',
  decorators: [
    (Story) => (
      <IntlProvider locale="en">
        <Story />
      </IntlProvider>
    ),
  ],
} as Meta<typeof Slider>;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    pk: 'slider-1',
    title: 'Example Slider',
    slides,
  },
};
