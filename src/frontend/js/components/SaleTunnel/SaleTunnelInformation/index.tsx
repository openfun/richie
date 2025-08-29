import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Select } from '@openfun/cunningham-react';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { SaleTunnelInformationGroup } from 'components/SaleTunnel/SaleTunnelInformation/SaleTunnelInformationGroup';
import { SaleTunnelInformationSingular } from 'components/SaleTunnel/SaleTunnelInformation/SaleTunnelInformationSingular';

const messages = defineMessages({
  purchaseTypeTitle: {
    id: 'components.SaleTunnel.Information.purchaseTypeTitle',
    description: 'Title for purchase type',
    defaultMessage: 'Select purchase type',
  },
  purchaseTypeSelect: {
    id: 'components.SaleTunnel.Information.purchaseTypeSelect',
    description: 'Label for purchase type select',
    defaultMessage: 'Purchase type',
  },
  purchaseTypeOptionSingle: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionSingle',
    description: 'Label for B2C option',
    defaultMessage: 'Single purchase (B2C)',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Label for B2C option',
    defaultMessage: 'Group purchase (B2B)',
  },
});

export const SaleTunnelInformation = () => {
  const { setBatchOrder } = useSaleTunnelContext();
  const intl = useIntl();
  const options = [
    { label: intl.formatMessage(messages.purchaseTypeOptionSingle), value: 'b2c' },
    { label: intl.formatMessage(messages.purchaseTypeOptionGroup), value: 'b2b' },
  ];
  const [purchaseType, setPurchaseType] = useState('b2c');

  return (
    <div className="sale-tunnel__main__column sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.purchaseTypeTitle} />
        </h3>
        <Select
          label={intl.formatMessage(messages.purchaseTypeSelect)}
          options={options}
          fullWidth
          value={purchaseType}
          clearable={false}
          onChange={(e) => {
            setPurchaseType(e.target.value as string);
            setBatchOrder(undefined);
          }}
        />
      </div>
      {purchaseType === 'b2c' && <SaleTunnelInformationSingular />}
      {purchaseType === 'b2b' && <SaleTunnelInformationGroup />}
    </div>
  );
};
