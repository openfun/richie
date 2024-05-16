import { defineMessages } from 'react-intl';
import { QueryOptions, useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { API, Certificate, CertificateResourcesQuery } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCertificates.errorGet',
    description: 'Error message shown to the user when certificates fetch request fails.',
    defaultMessage: 'An error occurred while fetching certificates. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCertificates.errorNotFound',
    description: 'Error message shown to the user when no certificate matches.',
    defaultMessage: 'Cannot find the certificate',
  },
});

const props: UseResourcesProps<
  Certificate,
  CertificateResourcesQuery,
  API['user']['certificates']
> = {
  queryKey: ['certificates'],
  apiInterface: () => useJoanieApi().user.certificates,
  session: true,
  messages,
};

export const useCertificates = (
  filters: CertificateResourcesQuery,
  queryOptions?: QueryOptions<Certificate>,
) => {
  return useResources(props)(filters, queryOptions);
};

export const useCertificate = useResource(props);
