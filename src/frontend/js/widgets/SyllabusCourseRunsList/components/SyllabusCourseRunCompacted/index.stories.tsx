import { Meta, StoryObj } from '@storybook/react-webpack5';
import { CourseRunFactory } from 'utils/test/factories/richie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { CourseCertificateOffer, CourseOffer } from 'types/Course';
import { SyllabusCourseRunCompacted } from '.';

export default {
  component: SyllabusCourseRunCompacted,
  render: (args) => StorybookHelper.wrapInApp(<SyllabusCourseRunCompacted {...args} />),
} as Meta<typeof SyllabusCourseRunCompacted>;

type Story = StoryObj<typeof SyllabusCourseRunCompacted>;

const courseRun = CourseRunFactory().one();

const singleDateCourseRun = {
  ...courseRun,
  start: null,
  enrollment_start: null,
  title: 'Certificate Product',
  price_currency: 'EUR',
  offer: CourseOffer.FREE,
  certificate_offer: CourseCertificateOffer.PAID,
  certificate_price: 100,
  discounted_price: null,
  discount: null,
} as any;

const course = {
  id: '038c4f92-542a-4652-8537-322a75297b75',
  code: 'IYfwh',
  is_self_paced: true,
};

export const CertificateSyllabusSingleDate: Story = {
  args: {
    courseRun: singleDateCourseRun,
    course,
    showLanguages: true,
  },
};
