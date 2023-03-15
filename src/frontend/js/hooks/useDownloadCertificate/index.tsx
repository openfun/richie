import { useState } from 'react';
import { handle } from 'utils/errors/handle';
import { useJoanieApi } from 'contexts/JoanieApiContext';

export const useDownloadCertificate = () => {
  const [loading, setLoading] = useState(false);
  const API = useJoanieApi();

  return {
    download: async (certificateId: string) => {
      setLoading(true);
      try {
        const $link = document.createElement('a');
        const file = await API.user.certificates.download(certificateId);
        // eslint-disable-next-line compat/compat
        const url = URL.createObjectURL(file);
        $link.href = url;
        $link.download = '';

        const revokeObject = () => {
          // eslint-disable-next-line compat/compat
          URL.revokeObjectURL(url);
          window.removeEventListener('blur', revokeObject);
        };

        window.addEventListener('blur', revokeObject);
        $link.click();
      } catch (error) {
        handle(error);
      }
      setLoading(false);
    },
    loading,
  };
};
