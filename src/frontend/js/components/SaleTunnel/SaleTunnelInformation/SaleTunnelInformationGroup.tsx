import { yupResolver } from '@hookform/resolvers/yup';
import { Step, StepLabel, Stepper } from '@mui/material';
import { Checkbox, Input, Radio, Select } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { GroupBuy } from 'types/Joanie';
import * as Yup from 'yup';
import Form, { CountrySelectField } from 'components/Form';
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
  purchaseOrder: { id: 'groupBuy.purchaseOrder', defaultMessage: 'Payment with purchase order' },
  withoutOrderForm: { id: 'groupBuy.withoutOrderForm', defaultMessage: 'Without order form' },
  opco: { id: 'groupBuy.opc', defaultMessage: 'OPCO' },
  organization: { id: 'groupBuy.organization', defaultMessage: 'Funding organization' },
  organizationName: { id: 'groupBuy.organizationName', defaultMessage: 'Organization name' },
  organizationAmount: { id: 'groupBuy.opcoAmount', defaultMessage: 'Amount covered' },
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
      <GroupBuyForm onSubmit={handleGroupBuySubmit} groupBuy={groupBuy} />
    </>
  );
};

const GroupBuyForm = ({ onSubmit, groupBuy }: Props) => {
  const validationSchema = Yup.object().shape({
    offering_id: Yup.string().required(),
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
    nb_seats: Yup.number().required().min(0),
    payment_method: Yup.string().required(),
    organism: Yup.string().required(),
    organism_amount: Yup.number().required(),
    recommandation: Yup.string().required(),
  });

  const defaultValues = {
    offering_id: '',
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
    nb_seats: 0,
    payment_method: '',
    organism: '',
    organism_amount: 0,
    recommandation: '',
  } as GroupBuy;

  const form = useForm<GroupBuy>({
    defaultValues: groupBuy || defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
  });

  const { handleSubmit, reset, register } = form;

  useEffect(() => {
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

  const renderStepContent = () => {
    return (
      <div className="step-content">
        <div className="step organization" hidden={activeStep !== 0}>
          <FormattedMessage {...messages.stepCompanyTitle} />
          <Input
            className="field"
            label={intl.formatMessage(messages.companyName)}
            {...register('company_name')}
          />
          <Input
            className="field"
            {...register('identification_number')}
            label={intl.formatMessage(messages.identificationNumber)}
          />
          <Input
            className="field"
            {...register('vat_number')}
            label={intl.formatMessage(messages.vatNumber)}
          />
          <Input
            className="field"
            {...register('address')}
            label={intl.formatMessage(messages.address)}
          />
          <div className="city-fields">
            <Input
              className="field"
              {...register('postcode')}
              label={intl.formatMessage(messages.postCode)}
            />
            <Input
              className="field"
              {...register('city')}
              label={intl.formatMessage(messages.city)}
            />
          </div>
          <CountrySelectField
            className="field"
            {...register('country')}
            label={intl.formatMessage(messages.country)}
          />
        </div>
        <div className="step admin" hidden={activeStep !== 1}>
          <FormattedMessage {...messages.stepAdminTitle} />
          <Input
            className="field"
            {...register('admin.last_name')}
            label={intl.formatMessage(messages.lastName)}
          />
          <Input
            className="field"
            {...register('admin.first_name')}
            label={intl.formatMessage(messages.firstName)}
          />
          <Input
            className="field"
            {...register('admin.role')}
            label={intl.formatMessage(messages.role)}
          />
          <Input
            className="field"
            {...register('admin.mail')}
            label={intl.formatMessage(messages.email)}
          />
          <Input
            className="field"
            {...register('admin.phone')}
            label={intl.formatMessage(messages.phone)}
          />
        </div>
        <div className="step billing" hidden={activeStep !== 2}>
          <FormattedMessage {...messages.stepBillingTitle} />
          <Input
            className="field"
            {...register('billing.company_name')}
            label={intl.formatMessage(messages.companyName)}
          />
          <Input
            className="field"
            {...register('billing.identification_number')}
            label={intl.formatMessage(messages.identificationNumber)}
          />
          <Input
            className="field"
            {...register('billing.address')}
            label={intl.formatMessage(messages.address)}
          />
          <div className="city-fields">
            <Input
              className="field"
              {...register('billing.postcode')}
              label={intl.formatMessage(messages.postCode)}
            />
            <Input
              className="field"
              {...register('billing.city')}
              label={intl.formatMessage(messages.city)}
            />
          </div>
          <CountrySelectField
            className="field"
            {...register('billing.country')}
            label={intl.formatMessage(messages.country)}
          />
          <Input
            className="field"
            {...register('billing.contact_name')}
            label={intl.formatMessage(messages.lastName)}
          />
          <Input
            className="field"
            {...register('billing.contact_mail')}
            label={intl.formatMessage(messages.email)}
          />
        </div>
        <div className="step student" hidden={activeStep !== 3}>
          <FormattedMessage {...messages.stepParticipantsTitle} />
          <Input
            className="field"
            type="number"
            min={1}
            {...register('nb_seats')}
            label={intl.formatMessage(messages.traineeNumber)}
          />
        </div>
        <div className="step financing" hidden={activeStep !== 4}>
          <FormattedMessage {...messages.stepFinancingTitle} />
          <div className="payment-block">
            <Radio
              {...register('payment_method')}
              value="card_payment"
              label={intl.formatMessage(messages.cardPayment)}
              checked
            />
            <Radio
              {...register('payment_method')}
              value="bank_transfer"
              label={intl.formatMessage(messages.bankTransfer)}
            />
            <Radio
              {...register('payment_method')}
              value="purchase_order"
              label={intl.formatMessage(messages.purchaseOrder)}
            />
          </div>
          <FormattedMessage {...messages.organization} />
          <div className="organism-block">
            <Input
              {...register('organism')}
              label={intl.formatMessage(messages.organizationName)}
            />
            <Input
              {...register('organism_amount')}
              type="number"
              label={intl.formatMessage(messages.organizationAmount)}
            />
          </div>
          <FormattedMessage {...messages.recommandation} />
          <Select
            {...register('recommandation')}
            label={intl.formatMessage(messages.participatingUniversities)}
            clearable={false}
            options={[
              { label: 'Rennes 1', value: 'rennes1' },
              { label: 'Rennes 2', value: 'rennes2' },
            ]}
            className="recommandation"
          />
        </div>
      </div>
    );
  };

  return (
    <FormProvider {...form}>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stepper activeStep={activeStep} alternativeLabel className="stepper">
          {steps.map((label, index) => (
            <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
        <pre style={{ marginTop: '2rem', background: '#eee', padding: '1rem' }}>
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
      </Form>
    </FormProvider>
  );
};
