import { Step, StepLabel, Stepper } from '@mui/material';
import { Checkbox, Input, Radio, Select } from '@openfun/cunningham-react';
import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the information section',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Description of the information section',
    defaultMessage: 'Those information will be used for billing',
  },
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
  stepCompany: {
    id: 'components.SaleTunnel.GroupBuyForm.stepCompany',
    defaultMessage: 'Organization',
  },
  stepAdmin: {
    id: 'components.SaleTunnel.GroupBuyForm.stepAdmin',
    defaultMessage: 'Follow-up',
  },
  stepBilling: {
    id: 'components.SaleTunnel.GroupBuyForm.stepBilling',
    defaultMessage: 'Billing',
  },
  stepParticipants: {
    id: 'components.SaleTunnel.GroupBuyForm.stepParticipants',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'components.SaleTunnel.GroupBuyForm.stepFinancing',
    defaultMessage: 'Financing',
  },
  stepCompanyTitle: {
    id: 'components.SaleTunnel.GroupBuyForm.stepCompanyTitle',
    defaultMessage: 'Information about your company / organisation',
  },
  stepAdminTitle: {
    id: 'components.SaleTunnel.GroupBuyForm.stepAdminTitle',
    defaultMessage: 'Responsible for the administrative follow-up',
  },
  stepBillingTitle: {
    id: 'components.SaleTunnel.GroupBuyForm.stepBillingTitle',
    defaultMessage: 'Needed if it does not concerns the initial company OR if OPCO',
  },
  stepParticipantsTitle: {
    id: 'components.SaleTunnel.GroupBuyForm.stepParticipantsTitle',
    defaultMessage: 'How many registrations ?',
  },
  stepFinancingTitle: {
    id: 'components.SaleTunnel.GroupBuyForm.stepFinancingTitle',
    defaultMessage: 'Payment plan of the course',
  },
  companyName: { id: 'groupBuy.companyName', defaultMessage: 'Company name' },
  siret: { id: 'groupBuy.siret', defaultMessage: 'SIRET number' },
  vatNumber: { id: 'groupBuy.vatNumber', defaultMessage: 'VAT number' },
  address: { id: 'groupBuy.address', defaultMessage: 'Address' },
  postalCode: { id: 'groupBuy.postalCode', defaultMessage: 'Postal code' },
  city: { id: 'groupBuy.city', defaultMessage: 'City' },
  country: { id: 'groupBuy.country', defaultMessage: 'Country' },
  firstName: { id: 'groupBuy.firstName', defaultMessage: 'First name' },
  lastName: { id: 'groupBuy.lastName', defaultMessage: 'Last name' },
  role: { id: 'groupBuy.role', defaultMessage: 'Role' },
  email: { id: 'groupBuy.email', defaultMessage: 'Email' },
  phone: { id: 'groupBuy.phone', defaultMessage: 'Phone' },
  birthDate: { id: 'groupBuy.birthDate', defaultMessage: 'Birth date' },
  participantNumber: { id: 'groupBuy.particpantNumber', defaultMessage: 'How many participants ?' },
  addParticipant: { id: 'groupBuy.addParticipant', defaultMessage: 'Add participant' },
  cardPayment: { id: 'groupBuy.cardPayment', defaultMessage: 'Payment by credit card' },
  bankTransfer: { id: 'groupBuy.bankTransfer', defaultMessage: 'Payment by bank transfer' },
  withOrderForm: { id: 'groupBuy.withOrderForm', defaultMessage: 'With order form' },
  withoutOrderForm: { id: 'groupBuy.withoutOrderForm', defaultMessage: 'Without order form' },
  opco: { id: 'groupBuy.opc', defaultMessage: 'OPCO' },
  opcoName: { id: 'groupBuy.opcName', defaultMessage: 'OPCO name' },
  opcoAmount: { id: 'groupBuy.opcoAmount', defaultMessage: 'OPCO - Amount covered' },
  jobCenter: { id: 'groupBuy.jobCenter', defaultMessage: 'Pôle emploi' },
  jobCenterAmount: {
    id: 'groupBuy.jobCenterAmount',
    defaultMessage: 'Pôle emploi - Amount covered',
  },
  other: { id: 'groupBuy.other', defaultMessage: 'Other' },
  otherSpecify: { id: 'groupBuy.otherSpecify', defaultMessage: 'Other - specify' },
  organism: { id: 'groupBuy.organisme', defaultMessage: 'Funding organism' },
  recommandation: {
    id: 'groupBuy.recommandation',
    defaultMessage: 'This course was recommended to me by',
  },
  participatingUniversities: {
    id: 'groupBuy.participatingUniversities',
    defaultMessage: 'Participating universities',
  },
});

export const SaleTunnelInformationGroup = () => {
  return (
    <>
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.title} />
        </h3>
        <div className="description mb-s">
          <FormattedMessage {...messages.description} />
        </div>
      </div>
      <GroupBuyForm />
    </>
  );
};

const GroupBuyForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const intl = useIntl();
  const steps = [
    intl.formatMessage(messages.stepCompany),
    intl.formatMessage(messages.stepAdmin),
    intl.formatMessage(messages.stepBilling),
    intl.formatMessage(messages.stepParticipants),
    intl.formatMessage(messages.stepFinancing),
  ];
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedOrganism, setSelectedOrganism] = useState('opco');
  const [studentCount, setStudentCount] = useState(1);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="step organization">
            <FormattedMessage {...messages.stepCompanyTitle} />
            <Input className="field" label={intl.formatMessage(messages.companyName)} required />
            <Input className="field" label={intl.formatMessage(messages.siret)} />
            <Input className="field" label={intl.formatMessage(messages.vatNumber)} />
            <Input className="field" label={intl.formatMessage(messages.address)} required />
            <Input className="field" label={intl.formatMessage(messages.postalCode)} required />
            <Input className="field" label={intl.formatMessage(messages.city)} required />
            <Input className="field" label={intl.formatMessage(messages.country)} required />
          </div>
        );
      case 1:
        return (
          <div className="step admin">
            <FormattedMessage {...messages.stepAdminTitle} />
            <Input className="field" label={intl.formatMessage(messages.lastName)} />
            <Input className="field" label={intl.formatMessage(messages.firstName)} />
            <Input className="field" label={intl.formatMessage(messages.role)} />
            <Input className="field" label={intl.formatMessage(messages.email)} />
            <Input className="field" label={intl.formatMessage(messages.phone)} />
          </div>
        );
      case 2:
        return (
          <div className="step billing">
            <FormattedMessage {...messages.stepBillingTitle} />
            <Input className="field" label={intl.formatMessage(messages.companyName)} />
            <Input className="field" label={intl.formatMessage(messages.siret)} />
            <Input className="field" label={intl.formatMessage(messages.address)} />
            <Input className="field" label={intl.formatMessage(messages.postalCode)} />
            <Input className="field" label={intl.formatMessage(messages.city)} />
            <Input className="field" label={intl.formatMessage(messages.country)} />
            <Input className="field" label={intl.formatMessage(messages.lastName)} />
            <Input className="field" label={intl.formatMessage(messages.email)} />
          </div>
        );
      case 3: {
        return (
          <div className="step student">
            <FormattedMessage {...messages.stepParticipantsTitle} />
            <Input
              className="field"
              type="number"
              label={intl.formatMessage(messages.participantNumber)}
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              min={1}
            />
          </div>
        );
      }
      case 4:
        return (
          <div className="step financing">
            <FormattedMessage {...messages.stepFinancingTitle} />
            <div className="payment-block">
              <Radio
                label={intl.formatMessage(messages.cardPayment)}
                onChange={() => setSelectedPayment('card')}
                checked={selectedPayment === 'card'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Radio
                  label={intl.formatMessage(messages.bankTransfer)}
                  onChange={() => setSelectedPayment('bank')}
                  checked={selectedPayment === 'bank'}
                />
                <Checkbox
                  label={intl.formatMessage(messages.withOrderForm)}
                  disabled={selectedPayment !== 'bank'}
                />
              </div>
            </div>
            <FormattedMessage {...messages.organism} />
            <div className="organism-block">
              <Select
                label={intl.formatMessage(messages.withOrderForm)}
                value={selectedOrganism}
                onChange={(e) => setSelectedOrganism(e.target.value as string)}
                options={[
                  { label: intl.formatMessage(messages.opco), value: 'opco' },
                  { label: intl.formatMessage(messages.jobCenter), value: 'jobCenter' },
                  { label: intl.formatMessage(messages.other), value: 'other' },
                ]}
                clearable={false}
                fullWidth
              />
              {selectedOrganism === 'opco' && (
                <div className="opco-order">
                  <Input label={intl.formatMessage(messages.opcoName)} />
                  <Input label={intl.formatMessage(messages.opcoAmount)} />
                </div>
              )}
              {selectedOrganism === 'jobCenter' && (
                <Input label={intl.formatMessage(messages.jobCenterAmount)} />
              )}
              {selectedOrganism === 'other' && (
                <Input label={intl.formatMessage(messages.otherSpecify)} />
              )}
            </div>
            <FormattedMessage {...messages.recommandation} />
            <Select
              className="university"
              label={intl.formatMessage(messages.participatingUniversities)}
              value="rennes1"
              clearable={false}
              options={[
                { label: 'Rennes 1', value: 'rennes1' },
                { label: 'Rennes 2', value: 'rennes2' },
              ]}
            />
          </div>
        );
    }
  };

  return (
    <div className="sale-tunnel__group-buy-form">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="step-content">{renderStepContent(activeStep)}</div>
    </div>
  );
};
