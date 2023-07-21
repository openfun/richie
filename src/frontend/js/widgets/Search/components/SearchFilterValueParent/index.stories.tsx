import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { HistoryProvider } from 'hooks/useHistory';
import { SearchFilterValueParent } from '.';

export default {
  component: SearchFilterValueParent,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    filter: {
      base_path: null,
      human_name: 'Awesome filter',
      is_autocompletable: false,
      is_searchable: false,
      name: 'Awesome filter',
      position: 1,
      has_more_values: true,
      values: [
        {
          count: 10,
          human_name: 'First value',
          key: 'P-0000',
        },
        { count: 20, human_name: 'Second value', key: 'P-0001' },
      ],
    },

    value: {
      count: 10,
      human_name: 'First value',
      key: 'P-0000',
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <HistoryProvider>
        <SearchFilterValueParent {...args} />
      </HistoryProvider>,
    );
  },
} as Meta<typeof SearchFilterValueParent>;

type Story = StoryObj<typeof SearchFilterValueParent>;

export const Default: Story = {};
