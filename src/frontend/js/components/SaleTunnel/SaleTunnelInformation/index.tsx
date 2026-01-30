import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Select } from '@openfun/cunningham-react';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { SaleTunnelInformationSingular } from 'components/SaleTunnel/SaleTunnelInformation/SaleTunnelInformationSingular';
import { SaleTunnelInformationGroup } from 'components/SaleTunnel/SaleTunnelInformation/SaleTunnelInformationGroup';

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
    defaultMessage: 'I am purchasing as an individual',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Label for B2C option',
    defaultMessage: 'I am purchasing on behalf of an organization',
  },
});

export enum FormType {
  GROUP = 'group',
  SINGULAR = 'singular',
}

export const SaleTunnelInformation = () => {
  const intl = useIntl();
  const { setBatchOrder, setSchedule } = useSaleTunnelContext();
  const options = [
    { label: intl.formatMessage(messages.purchaseTypeOptionSingle), value: FormType.SINGULAR },
    { label: intl.formatMessage(messages.purchaseTypeOptionGroup), value: FormType.GROUP },
  ];
  const [purchaseType, setPurchaseType] = useState(FormType.SINGULAR);

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
            setPurchaseType(e.target.value as FormType);
            setBatchOrder(undefined);
            setSchedule(undefined);
          }}
        />
      </div>
      {purchaseType === FormType.SINGULAR && <SaleTunnelInformationSingular />}
      {purchaseType === FormType.GROUP && <SaleTunnelInformationGroup />}
    </div>
  );
};
