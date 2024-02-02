import { useState } from 'react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { browserDownloadFromBlob } from 'utils/download';

export const useDownloadCertificate = () => {
  const [loading, setLoading] = useState(false);
  const API = useJoanieApi();

  return {
    download: async (certificateId: string) => {
      setLoading(true);
      await browserDownloadFromBlob(() => API.user.certificates.download(certificateId));
      setLoading(false);
    },
    loading,
  };
};
