import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import { TargetCourseFactory } from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { Priority } from 'types';
import { enrollment } from '../stories.mock';
import { DashboardItemCourseEnrolling } from '.';

export default {
  component: DashboardItemCourseEnrolling,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) =>
    StorybookHelper.wrapInApp(
      <RouterProvider
        router={createMemoryRouter([
          {
            index: true,
            element: (
              <div className="dashboard-item__block__footer">
                <DashboardItemCourseEnrolling {...args} />
              </div>
            ),
          },
        ])}
      />,
    ),
} as Meta<typeof DashboardItemCourseEnrolling>;

type Story = StoryObj<typeof DashboardItemCourseEnrolling>;

// Readonly

export const ReadonlyEnrolledOpened: Story = {
  args: {
    course: TargetCourseFactory().one(),
    activeEnrollment: {
      ...enrollment,
      course_run: {
        ...enrollment.course_run,
        end: faker.date.future({ years: 1 }).toISOString(),
        state: { ...enrollment.course_run.state, priority: Priority.FUTURE_NOT_YET_OPEN },
      },
    },
  },
};

export const ReadonlyEnrolledClosed: Story = {
  args: {
    course: TargetCourseFactory().one(),
    activeEnrollment: {
      ...enrollment,
      course_run: {
        ...enrollment.course_run,
        end: faker.date.past({ years: 1 }).toISOString(),
        state: { ...enrollment.course_run.state, priority: Priority.FUTURE_CLOSED },
      },
    },
  },
};

export const ReadonlyNotEnrolled: Story = {
  args: {
    course: TargetCourseFactory().one(),
  },
};
