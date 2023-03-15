import { ComponentMeta, ComponentStory } from '@storybook/react';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate/index';
import { StorybookHelper } from 'utils/StorybookHelper';
import { CertificateFactory } from 'utils/test/factories/joanie';

export default {
  title: 'Components/Dashboard/Certificate',
  component: DashboardItemCertificate,
} as ComponentMeta<typeof DashboardItemCertificate>;

const Template: ComponentStory<typeof DashboardItemCertificate> = (args) =>
  StorybookHelper.wrapInApp(<DashboardItemCertificate {...args} />);

export const Default = Template.bind({});
Default.args = {
  certificate: CertificateFactory.generate(),
};
Default.parameters = {
  docs: {
    source: {
      code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
    },
  },
};
