import { Meta, StoryObj } from '@storybook/react';
import { RichieContextFactory, CourseLightFactory } from 'utils/test/factories/richie';
import { CourseGlimpse } from '.';

export default {
  component: CourseGlimpse,
} as Meta<typeof CourseGlimpse>;

type Story = StoryObj<typeof CourseGlimpse>;

export const RichieCourse: Story = {
  args: {
    context: RichieContextFactory().generate(),
    course: CourseLightFactory.generate(),
  },
};
