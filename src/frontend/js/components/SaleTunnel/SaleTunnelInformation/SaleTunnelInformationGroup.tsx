import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Step, StepLabel, Stepper } from '@mui/material';
import { Button } from '@openfun/cunningham-react';
import { BatchOrder } from 'types/Joanie';
import Form from 'components/Form';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { ObjectHelper } from 'utils/ObjectHelper';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import { StepContent } from 'components/SaleTunnel/SaleTunnelInformation/StepContent';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the section containing purchase/billing information',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Helper text explaining that the information will be used for billing',
    defaultMessage: 'This information will be used for billing',
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
    defaultMessage: 'I am purchasing as an individual',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Option label for selecting a group purchase (B2B)',
    defaultMessage: 'I am purchasing on behalf of an organization',
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
  previousButton: {
    id: 'components.SaleTunnel.BatchOrderForm.previousButton',
    description: 'Label for the button to go back to the previous step in the batch order form',
    defaultMessage: 'Previous',
  },
  nextButton: {
    id: 'components.SaleTunnel.BatchOrderForm.nextButton',
    description: 'Label for the button to proceed to the next step in the batch order form',
    defaultMessage: 'Next',
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

const EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;

export const validationSchema = Yup.object().shape({
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
  administrative_email: Yup.string().matches(EMAIL_REGEX).required(),
  administrative_telephone: Yup.string().required(),
  signatory_lastname: Yup.string().required(),
  signatory_firstname: Yup.string().required(),
  signatory_profession: Yup.string().required(),
  signatory_email: Yup.string().matches(EMAIL_REGEX).required(),
  signatory_telephone: Yup.string().required(),
  billing_address: Yup.object()
    .optional()
    .shape({
      company_name: Yup.string().optional(),
      identification_number: Yup.string().optional(),
      contact_name: Yup.string().optional(),
      contact_email: Yup.string().matches(EMAIL_REGEX).optional(),
      address: Yup.string().optional(),
      postcode: Yup.string().optional(),
      city: Yup.string().optional(),
      country: Yup.string().optional(),
    }),
  nb_seats: Yup.number().required().min(1),
  payment_method: Yup.mixed<PaymentMethod>().oneOf(Object.values(PaymentMethod)).required(),
  funding_entity: Yup.string().optional(),
  funding_amount: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional(),
  organization_id: Yup.string().optional(),
});

const requiredFieldsByStep: (keyof BatchOrder)[][] = [
  ['company_name', 'identification_number', 'address', 'postcode', 'city', 'country'],
  [
    'administrative_lastname',
    'administrative_firstname',
    'administrative_profession',
    'administrative_email',
    'administrative_telephone',
  ],
  [
    'signatory_lastname',
    'signatory_firstname',
    'signatory_profession',
    'signatory_email',
    'signatory_telephone',
  ],
  ['nb_seats'],
  ['payment_method'],
];

const BatchOrderForm = () => {
  const intl = useIntl();
  const { offering, batchOrder, setBatchOrder, setBatchOrderFormMethods } = useSaleTunnelContext();
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
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
    payment_method: undefined as any,
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

  useEffect(() => {
    const validateStep = async () => {
      if (activeStep === 0 && batchOrder?.billing_address?.contact_email) {
        const isEmailValid = EMAIL_REGEX.test(batchOrder.billing_address.contact_email);
        if (!isEmailValid) {
          setIsCurrentStepValid(false);
          return;
        }
      }
      const fieldsToValidate = requiredFieldsByStep[activeStep];
      const validationPromises = fieldsToValidate.map(async (field) => {
        try {
          const fieldSchema = Yup.reach(validationSchema, field) as Yup.Schema;
          await fieldSchema.validate(batchOrder?.[field]);
          return true;
        } catch {
          return false;
        }
      });
      const results = await Promise.all(validationPromises);
      const isStepValid = results.every((isValid) => isValid);
      setIsCurrentStepValid(isStepValid);
    };
    validateStep();
  }, [activeStep, batchOrder]);

  return (
    <FormProvider {...form}>
      <Form noValidate>
        <Stepper activeStep={activeStep} alternativeLabel className="stepper">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                onClick={() => {
                  if (index < activeStep) {
                    setActiveStep(index);
                  }
                }}
                style={{ cursor: index < activeStep ? 'pointer' : 'default' }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <StepContent activeStep={activeStep} form={form} />
      </Form>
      <div className="navigationButton">
        <Button
          onClick={() => {
            if (activeStep > 0) {
              setActiveStep(activeStep - 1);
            }
          }}
          hidden={activeStep === 0}
          color="tertiary"
        >
          <FormattedMessage {...messages.previousButton} />
        </Button>
        <Button
          onClick={() => {
            if (activeStep < steps.length - 1) {
              setActiveStep(activeStep + 1);
            }
          }}
          disabled={!isCurrentStepValid}
          hidden={activeStep === steps.length - 1}
        >
          <FormattedMessage {...messages.nextButton} />
        </Button>
      </div>
    </FormProvider>
  );
};
