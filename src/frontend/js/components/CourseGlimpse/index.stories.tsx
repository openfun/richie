import { Meta, StoryObj } from '@storybook/react-webpack5';
import { CourseLightFactory, RichieContextFactory } from 'utils/test/factories/richie';
import { CourseGlimpse, getCourseGlimpseProps } from 'components/CourseGlimpse';
import { CourseCertificateOffer, CourseOffer } from 'types/Course';

export default {
  component: CourseGlimpse,
} as Meta<typeof CourseGlimpse>;

type Story = StoryObj<typeof CourseGlimpse>;

const richieContext = RichieContextFactory().one();
const courseLight = CourseLightFactory().one();
const courseGlimpseCourse = getCourseGlimpseProps(courseLight);

export const RichieCourse: Story = {
  args: {
    context: richieContext,
    course: { ...courseGlimpseCourse },
  },
};

export const certificateProduct: Story = {
  args: {
    context: richieContext,
    course: {
      ...courseGlimpseCourse,
      title: 'Certificate Product',
      offer: CourseOffer.FREE,
      price: null,
      certificate_offer: CourseCertificateOffer.PAID,
      certificate_price: 100,
      discounted_price: null,
      discount: null,
    },
  },
};

export const certificateProductDiscount: Story = {
  args: {
    context: richieContext,
    course: {
      ...courseGlimpseCourse,
      title: 'Certificate Product with Discount',
      offer: CourseOffer.FREE,
      price: null,
      certificate_offer: CourseCertificateOffer.PAID,
      certificate_price: 100,
      discounted_price: 80,
      discount: '-20 €',
    },
  },
};

export const credentialProduct: Story = {
  args: {
    context: richieContext,
    course: {
      ...courseGlimpseCourse,
      title: 'Credential Product',
      icon: null,
      offer: CourseOffer.PAID,
      price: 100,
      certificate_offer: null,
      certificate_price: null,
      discounted_price: null,
      discount: null,
    },
  },
};

export const credentialProductDiscount: Story = {
  args: {
    context: richieContext,
    course: {
      ...courseGlimpseCourse,
      title: 'Credential Product with Discount',
      icon: null,
      offer: CourseOffer.PAID,
      price: 100,
      certificate_offer: null,
      certificate_price: null,
      discounted_price: 80,
      discount: '-20 €',
    },
  },
};
