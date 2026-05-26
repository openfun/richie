import { useState } from 'react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { browserDownloadFromBlob } from 'utils/download';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';

export const useDownloadBatchOrderSeats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | undefined>();
  const API = useJoanieApi();

  return {
    download: async (batchOrderId: string, filename?: string) => {
      setLoading(true);
      setError(undefined);
      try {
        const downloadFn = async () => {
          try {
            return await API.user.batchOrders.seats_export(batchOrderId);
          } catch (err) {
            if (err instanceof HttpError && err.code === HttpStatusCode.UNPROCESSABLE_ENTITY) {
              setError(err);
            }
            throw err;
          }
        };
        await browserDownloadFromBlob(downloadFn, false, filename);
      } finally {
        setLoading(false);
      }
    },
    loading,
    error,
  };
};
