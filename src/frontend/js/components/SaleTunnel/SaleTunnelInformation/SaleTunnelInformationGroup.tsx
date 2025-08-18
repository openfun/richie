import { yupResolver } from '@hookform/resolvers/yup';
import { Step, StepLabel, Stepper } from '@mui/material';
import { Checkbox, Input, Radio, Select } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { GroupBuy } from 'types/Joanie';
import * as Yup from 'yup';
import Form from 'components/Form';
import { Maybe } from 'types/utils';

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
  identificationNumber: { id: 'groupBuy.identificationNumber', defaultMessage: 'SIRET number' },
  vatNumber: { id: 'groupBuy.vatNumber', defaultMessage: 'VAT number' },
  address: { id: 'groupBuy.address', defaultMessage: 'Address' },
  postCode: { id: 'groupBuy.postCode', defaultMessage: 'Post code' },
  city: { id: 'groupBuy.city', defaultMessage: 'City' },
  country: { id: 'groupBuy.country', defaultMessage: 'Country' },
  firstName: { id: 'groupBuy.firstName', defaultMessage: 'First name' },
  lastName: { id: 'groupBuy.lastName', defaultMessage: 'Last name' },
  role: { id: 'groupBuy.role', defaultMessage: 'Role' },
  email: { id: 'groupBuy.email', defaultMessage: 'Email' },
  phone: { id: 'groupBuy.phone', defaultMessage: 'Phone' },
  birthDate: { id: 'groupBuy.birthDate', defaultMessage: 'Birth date' },
  traineeNumber: { id: 'groupBuy.traineeNumber', defaultMessage: 'How many participants ?' },
  addTrainee: { id: 'groupBuy.addTrainee', defaultMessage: 'Add participant' },
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

interface Props {
  groupBuy?: GroupBuy;
  onSubmit: (values: GroupBuy) => Promise<void>;
  handleReset: () => void;
}

export const SaleTunnelInformationGroup = () => {
  const [groupBuy, setGroupBuy] = useState<Maybe<GroupBuy>>();
  const handleGroupBuySubmit = async (values: GroupBuy) => {
    try {
      console.log('Formulaire envoyé avec succès', values);
    } catch (error) {
      console.error('Erreur lors de l’envoi du formulaire', error);
    }
  };
  const handleResetGroupBuy = () => {
    setGroupBuy(undefined);
  };

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
      <GroupBuyForm
        onSubmit={handleGroupBuySubmit}
        handleReset={handleResetGroupBuy}
        groupBuy={groupBuy}
      />
    </>
  );
};

const GroupBuyForm = ({ onSubmit, groupBuy, handleReset }: Props) => {
  const validationSchema = Yup.object().shape({
    relation_id: Yup.string().required(),
    company_name: Yup.string().required(),
    identification_number: Yup.string().required(),
    vat_number: Yup.string().required(),
    address: Yup.string().required(),
    postcode: Yup.string().required(),
    city: Yup.string().required(),
    country: Yup.string().required(),
    admin: Yup.object().shape({
      last_name: Yup.string().required(),
      first_name: Yup.string().required(),
      role: Yup.string().required(),
      mail: Yup.string().email().required(),
      phone: Yup.string().required(),
    }),
    billing: Yup.object().shape({
      company_name: Yup.string().required(),
      identification_number: Yup.string().required(),
      vat_number: Yup.string().required(),
      address: Yup.string().required(),
      postcode: Yup.string().required(),
      city: Yup.string().required(),
      country: Yup.string().required(),
      contact_name: Yup.string().required(),
      contact_mail: Yup.string().email().required(),
    }),
    trainees: Yup.number().required().min(0),
    payment_type: Yup.string().required(),
    order_form: Yup.boolean().required(),
    organism: Yup.string().required(),
    organism_amount: Yup.string().required(),
    recommandation: Yup.string().required(),
  });

  const defaultValues = {
    relation_id: '',
    company_name: '',
    identification_number: '',
    vat_number: '',
    address: '',
    postcode: '',
    city: '',
    country: '',
    admin: {
      last_name: '',
      first_name: '',
      role: '',
      mail: '',
      phone: '',
    },
    billing: {
      company_name: '',
      identification_number: '',
      vat_number: '',
      address: '',
      postcode: '',
      city: '',
      country: '',
      contact_name: '',
      contact_mail: '',
    },
    trainees: 0,
    payment_type: '',
    order_form: false,
    organism: '',
    organism_amount: '',
    recommandation: '',
  } as GroupBuy;

  const form = useForm<GroupBuy>({
    defaultValues: groupBuy || defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    console.log('logging groupbuy', groupBuy);
    reset(groupBuy ?? defaultValues);
  }, [groupBuy]);

  const [activeStep, setActiveStep] = useState(0);
  const intl = useIntl();
  const [selectedOrganism, setSelectedOrganism] = useState('opco');

  const steps = [
    intl.formatMessage(messages.stepCompany),
    intl.formatMessage(messages.stepAdmin),
    intl.formatMessage(messages.stepBilling),
    intl.formatMessage(messages.stepParticipants),
    intl.formatMessage(messages.stepFinancing),
  ];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="step organization">
            <FormattedMessage {...messages.stepCompanyTitle} />
            <Input
              className="field"
              name="company_name"
              label={intl.formatMessage(messages.companyName)}
            />
            <Input
              className="field"
              name="identification_number"
              label={intl.formatMessage(messages.identificationNumber)}
            />
            <Input
              className="field"
              name="vat_number"
              label={intl.formatMessage(messages.vatNumber)}
            />
            <Input className="field" name="address" label={intl.formatMessage(messages.address)} />
            <Input
              className="field"
              name="postcode"
              label={intl.formatMessage(messages.postCode)}
            />
            <Input className="field" name="city" label={intl.formatMessage(messages.city)} />
            <Input className="field" name="country" label={intl.formatMessage(messages.country)} />
          </div>
        );
      case 1:
        return (
          <div className="step admin">
            <FormattedMessage {...messages.stepAdminTitle} />
            <Input
              className="field"
              name="admin.last_name"
              label={intl.formatMessage(messages.lastName)}
            />
            <Input
              className="field"
              name="admin.first_name"
              label={intl.formatMessage(messages.firstName)}
            />
            <Input className="field" name="admin.role" label={intl.formatMessage(messages.role)} />
            <Input className="field" name="admin.mail" label={intl.formatMessage(messages.email)} />
            <Input
              className="field"
              name="admin.phone"
              label={intl.formatMessage(messages.phone)}
            />
          </div>
        );
      case 2:
        return (
          <div className="step billing">
            <FormattedMessage {...messages.stepBillingTitle} />
            <Input
              className="field"
              name="billing.company_name"
              label={intl.formatMessage(messages.companyName)}
            />
            <Input
              className="field"
              name="billing.identification_number"
              label={intl.formatMessage(messages.identificationNumber)}
            />
            <Input
              className="field"
              name="billing.address"
              label={intl.formatMessage(messages.address)}
            />
            <Input
              className="field"
              name="billing.postcode"
              label={intl.formatMessage(messages.postCode)}
            />
            <Input
              className="field"
              name="billing.city"
              label={intl.formatMessage(messages.city)}
            />
            <Input
              className="field"
              name="billing.country"
              label={intl.formatMessage(messages.country)}
            />
            <Input
              className="field"
              name="billing.contact_name"
              label={intl.formatMessage(messages.lastName)}
            />
            <Input
              className="field"
              name="billing.contact_mail"
              label={intl.formatMessage(messages.email)}
            />
          </div>
        );
      case 3:
        return (
          <div className="step student">
            <FormattedMessage {...messages.stepParticipantsTitle} />
            <Input
              className="field"
              type="number"
              min={1}
              name="trainees"
              label={intl.formatMessage(messages.traineeNumber)}
            />
          </div>
        );
      case 4:
        return (
          <div className="step financing">
            <FormattedMessage {...messages.stepFinancingTitle} />
            <div className="payment-block">
              <Radio
                name="payment_type"
                value="card"
                label={intl.formatMessage(messages.cardPayment)}
              />
              <Radio
                name="payment_type"
                value="bank"
                label={intl.formatMessage(messages.bankTransfer)}
              />
              <Checkbox name="order_form" label={intl.formatMessage(messages.withOrderForm)} />
            </div>
            <FormattedMessage {...messages.organism} />
            <div className="organism-block">
              <Select
                label={intl.formatMessage(messages.organism)}
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
                  <Input name="organism" label={intl.formatMessage(messages.opcoName)} />
                  <Input name="organism_amount" label={intl.formatMessage(messages.opcoAmount)} />
                </div>
              )}
              {selectedOrganism === 'jobCenter' && (
                <Input label={intl.formatMessage(messages.jobCenterAmount)} />
              )}
              {selectedOrganism === 'other' && (
                <Input name="organism" label={intl.formatMessage(messages.otherSpecify)} />
              )}
            </div>
            <FormattedMessage {...messages.recommandation} />
            <Select
              name="recommandation"
              label={intl.formatMessage(messages.participatingUniversities)}
              value="rennes1"
              clearable={false}
              options={[
                { label: 'Rennes 1', value: 'rennes1' },
                { label: 'Rennes 2', value: 'rennes2' },
              ]}
              className="recommandation"
            />
          </div>
        );
    }
  };

  return (
    <FormProvider {...form}>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className="step-content">{renderStepContent(activeStep)}</div>
        <pre style={{ marginTop: '2rem', background: '#eee', padding: '1rem' }}>
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
      </Form>
    </FormProvider>
  );
};
