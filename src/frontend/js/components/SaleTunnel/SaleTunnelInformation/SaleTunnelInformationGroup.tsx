import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Step, StepLabel, Stepper } from '@mui/material';
import { BatchOrder } from 'types/Joanie';
import Form from 'components/Form';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { StepContent } from 'components/SaleTunnel/SaleTunnelInformation/StepContent';
import { ObjectHelper } from 'utils/ObjectHelper';
import { PaymentMethod } from 'components/PaymentInterfaces/types';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the section containing purchase/billing information',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Helper text explaining that the information will be used for billing',
    defaultMessage: 'Those information will be used for billing',
  },
  purchaseTypeTitle: {
    id: 'components.SaleTunnel.Information.purchaseTypeTitle',
    description: 'Title of the section where the user selects the purchase type',
    defaultMessage: 'Select purchase type',
  },
  purchaseTypeSelect: {
    id: 'components.SaleTunnel.Information.purchaseTypeSelect',
    description: 'Label for the select field used to choose the purchase type',
    defaultMessage: 'Purchase type',
  },
  purchaseTypeOptionSingle: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionSingle',
    description: 'Option label for selecting a single purchase (B2C)',
    defaultMessage: 'Single purchase (B2C)',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Option label for selecting a group purchase (B2B)',
    defaultMessage: 'Group purchase (B2B)',
  },
  stepCompany: {
    id: 'components.SaleTunnel.BatchOrderForm.stepCompany',
    description: 'Step label for company information in the batch order form',
    defaultMessage: 'Organization',
  },
  stepAdmin: {
    id: 'components.SaleTunnel.BatchOrderForm.stepAdmin',
    description: 'Step label for administrative follow-up in the batch order form',
    defaultMessage: 'Follow-up',
  },
  stepSignatory: {
    id: 'components.SaleTunnel.BatchOrderForm.stepSignatory',
    description: 'Step label for signatory person in the batch order form',
    defaultMessage: 'Signatory',
  },
  stepParticipants: {
    id: 'components.SaleTunnel.BatchOrderForm.stepParticipants',
    description: 'Step label for participants information in the batch order form',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'components.SaleTunnel.BatchOrderForm.stepFinancing',
    description: 'Step label for financing/payment in the batch order form',
    defaultMessage: 'Financing',
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
      <BatchOrderForm />
    </>
  );
};

const validationSchema = Yup.object().shape({
  offering_id: Yup.string().required(),
  company_name: Yup.string().required(),
  identification_number: Yup.string().required(),
  vat_registration: Yup.string().optional(),
  address: Yup.string().required(),
  postcode: Yup.string().required(),
  city: Yup.string().required(),
  country: Yup.string().required(),
  administrative_lastname: Yup.string().required(),
  administrative_firstname: Yup.string().required(),
  administrative_profession: Yup.string().required(),
  administrative_email: Yup.string().email().required(),
  administrative_telephone: Yup.string().required(),
  signatory_lastname: Yup.string().required(),
  signatory_firstname: Yup.string().required(),
  signatory_profession: Yup.string().required(),
  signatory_email: Yup.string().required(),
  signatory_telephone: Yup.string().required(),
  billing: Yup.object().optional().shape({
    company_name: Yup.string().optional(),
    identification_number: Yup.string().optional(),
    contact_name: Yup.string().optional(),
    contact_email: Yup.string().email().optional(),
    address: Yup.string().optional(),
    postcode: Yup.string().optional(),
    city: Yup.string().optional(),
    country: Yup.string().optional(),
  }),
  nb_seats: Yup.number().required().min(1),
  payment_method: Yup.mixed<PaymentMethod>().oneOf(Object.values(PaymentMethod)).required(),
  funding_entity: Yup.string().optional(),
  funding_amount: Yup.number().optional(),
  organization_id: Yup.string().optional(),
});

const BatchOrderForm = () => {
  const intl = useIntl();
  const { offering, batchOrder, setBatchOrder, setBatchOrderFormMethods } = useSaleTunnelContext();
  const defaultValues: BatchOrder = {
    offering_id: offering?.id ?? '',
    company_name: '',
    identification_number: '',
    address: '',
    postcode: '',
    city: '',
    country: '',
    administrative_lastname: '',
    administrative_firstname: '',
    administrative_profession: '',
    administrative_email: '',
    administrative_telephone: '',
    signatory_lastname: '',
    signatory_firstname: '',
    signatory_profession: '',
    signatory_email: '',
    signatory_telephone: '',
    nb_seats: 0,
    payment_method: PaymentMethod.PURCHASE_ORDER,
    funding_amount: 0,
  };

  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    intl.formatMessage(messages.stepCompany),
    intl.formatMessage(messages.stepAdmin),
    intl.formatMessage(messages.stepSignatory),
    intl.formatMessage(messages.stepParticipants),
    intl.formatMessage(messages.stepFinancing),
  ];

  const form = useForm<BatchOrder>({
    defaultValues: batchOrder || defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
  });
  const { watch } = form;
  const values = watch();

  useEffect(() => {
    setBatchOrderFormMethods(form);
  }, [form]);

  useEffect(() => {
    const cleanedValues = ObjectHelper.removeEmptyFields(values);
    if (JSON.stringify(cleanedValues) !== JSON.stringify(batchOrder)) {
      setBatchOrder(cleanedValues);
    }
  }, [values, batchOrder, setBatchOrder]);

  return (
    <FormProvider {...form}>
      <Form noValidate>
        <Stepper activeStep={activeStep} alternativeLabel className="stepper">
          {steps.map((label, index) => (
            <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <StepContent activeStep={activeStep} form={form} />
      </Form>
    </FormProvider>
  );
};
