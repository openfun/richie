import { Meta, StoryObj } from '@storybook/react';
import { CourseRunFactory, PacedCourseFactory } from 'utils/test/factories/richie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { CourseCertificateOffer, CourseOffer } from '../../../../types/Course';
import { SyllabusCourseRun } from '.';

export default {
  component: SyllabusCourseRun,
  render: (args) => {
    return StorybookHelper.wrapInApp(<SyllabusCourseRun {...args} />);
  },
} as Meta<typeof SyllabusCourseRun>;

type Story = StoryObj<typeof SyllabusCourseRun>;

const courseRun = CourseRunFactory().one();

export const certificateSyllabusCourseRun: Story = {
  args: {
    courseRun: {
      ...courseRun,
      title: 'Certificate Product',
      price_currency: 'EUR',
      offer: CourseOffer.FREE,
      certificate_offer: CourseCertificateOffer.PAID,
      certificate_price: 100,
      discounted_price: null,
      discount: null,
    },
    course: PacedCourseFactory().one(),
    showLanguages: true,
  },
};
export const certificateDiscountSyllabusCourseRun: Story = {
  args: {
    courseRun: {
      ...courseRun,
      title: 'Certificate Product',
      price_currency: 'EUR',
      offer: CourseOffer.FREE,
      certificate_offer: CourseCertificateOffer.PAID,
      certificate_price: 100,
      certificate_discounted_price: 80,
      certificate_discount: '-20 €',
    },
    course: PacedCourseFactory().one(),
    showLanguages: true,
  },
};
export const credentialSyllabusCourseRun: Story = {
  args: {
    courseRun: {
      ...courseRun,
      title: 'Certificate Product',
      price_currency: 'EUR',
      offer: CourseOffer.PAID,
      price: 100,
      certificate_offer: CourseCertificateOffer.FREE,
      discounted_price: null,
      discount: null,
    },
    course: PacedCourseFactory().one(),
    showLanguages: true,
  },
};
export const credentialDiscountSyllabusCourseRun: Story = {
  args: {
    courseRun: {
      ...courseRun,
      title: 'Certificate Product',
      price_currency: 'EUR',
      offer: CourseOffer.PAID,
      price: 100,
      certificate_offer: CourseCertificateOffer.FREE,
      discounted_price: 80,
      discount: '-20 €',
    },
    course: PacedCourseFactory().one(),
    showLanguages: true,
  },
};
