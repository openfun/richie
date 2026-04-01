import { useState } from 'react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { browserDownloadFromBlob } from 'utils/download';

export const useDownloadBatchOrderSeats = () => {
  const [loading, setLoading] = useState(false);
  const API = useJoanieApi();

  return {
    download: async (batchOrderId: string, filename?: string) => {
      setLoading(true);
      try {
        await browserDownloadFromBlob(
          () => API.user.batchOrders.seats_export(batchOrderId),
          false,
          filename,
        );
      } finally {
        setLoading(false);
      }
    },
    loading,
  };
};
