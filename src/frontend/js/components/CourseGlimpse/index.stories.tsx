import { ComponentMeta, ComponentStory } from '@storybook/react';
import { RichieContextFactory, CourseFactory } from 'utils/test/factories/richie';
import { CourseGlimpse } from '.';

export default {
  title: 'Components/CourseGlimpse',
  component: CourseGlimpse,
} as ComponentMeta<typeof CourseGlimpse>;

const Template: ComponentStory<typeof CourseGlimpse> = (args) => <CourseGlimpse {...args} />;

export const RichieCourse = Template.bind({});
RichieCourse.args = {
  context: RichieContextFactory().generate(),
  course: CourseFactory.generate(),
};
