import { useState } from 'react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { browserDownloadFromBlob } from 'utils/download';

export const useDownloadAgreement = () => {
  const [loading, setLoading] = useState(false);
  const API = useJoanieApi();

  return {
    download: async (organizationId: string, agreementId: string) => {
      setLoading(true);
      await browserDownloadFromBlob(() =>
        API.organizations.agreements.download({
          organization_id: organizationId,
          id: agreementId,
        }),
      );
      setLoading(false);
    },
    loading,
  };
};
