import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { OrganizationQuote, OrganizationQuoteQueryFilters } from 'types/Joanie';

const messages = defineMessages({
  errorCreate: {
    id: 'hooks.useOrganizationsQuotes.errorGet',
    defaultMessage: 'An error occurred while fetching the batch order.',
    description: 'Error message shown when batch order fetch fails.',
  },
});

export const useOrganizationsQuotes = () => {
  const { organizations } = useJoanieApi();
  const api = organizations.quotes;
  const props: UseResourcesProps<OrganizationQuote, OrganizationQuoteQueryFilters, typeof api> = {
    queryKey: ['organizationQuote'],
    apiInterface: () => api,
    session: true,
    messages,
  };

  const quotes = useResources<OrganizationQuote, OrganizationQuoteQueryFilters>(props);
  const quote = useResource<OrganizationQuote, OrganizationQuoteQueryFilters>(props);

  const confirmQuote = async (filters: OrganizationQuoteQueryFilters) => {
    return api.update(filters);
  };

  const confirmPurchaseOrder = async (filters: OrganizationQuoteQueryFilters) => {
    return api.purchase_order.update(filters);
  };

  const confirmBankTransfer = async (filters: OrganizationQuoteQueryFilters) => {
    return api.bank_transfer.create(filters);
  };

  const submitForSignature = async (filters: OrganizationQuoteQueryFilters) => {
    return api.submit_for_signature.create(filters);
  };

  const downloadQuote = async (filters: OrganizationQuoteQueryFilters) => {
    return api.download_quote.get(filters);
  };

  return {
    quotes,
    quote,
    confirmQuote,
    confirmPurchaseOrder,
    confirmBankTransfer,
    submitForSignature,
    downloadQuote,
  };
};
