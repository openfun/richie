import { Meta, StoryObj } from '@storybook/react';
import { RichieContextFactory, CourseLightFactory } from 'utils/test/factories/richie';
import { CourseGlimpseList, getCourseGlimpseListProps } from '.';

export default {
  component: CourseGlimpseList,
} as Meta<typeof CourseGlimpseList>;

type Story = StoryObj<typeof CourseGlimpseList>;

export const RichieCourseList: Story = {
  args: {
    context: RichieContextFactory().one(),
    courses: getCourseGlimpseListProps(CourseLightFactory().many(10)),
    meta: {
      count: 10,
      offset: 0,
      total_count: 100,
    },
  },
};
