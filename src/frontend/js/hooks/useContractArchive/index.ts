import { useJoanieApi } from 'contexts/JoanieApiContext';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';

const extractArchiveId = (url: string): string => {
  const uuidRegex = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
  const match = url.match(uuidRegex);

  if (match === null) {
    const error = new Error(
      'Unable to extract `contractArchiveId` from `contract.zip_archive.create` response',
    );
    handle(error);
    throw error;
  }

  return match[0];
};

// TODO: should be factorized with useDownloadCertificate
// and maybe DownloadContractButton
const buildArchiveFromBlob = (fileName: string, blob: Blob) => {
  // eslint-disable-next-line compat/compat
  const url = URL.createObjectURL(blob);
  const $link = document.createElement('a');
  $link.href = url;
  $link.download = fileName;

  const revokeObject = () => {
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL(url);
    window.removeEventListener('blur', revokeObject);
  };

  window.addEventListener('blur', revokeObject);
  $link.click();
};

const useContractArchive = () => {
  const api = useJoanieApi();
  return {
    methods: {
      check: async (archiveId: string): Promise<boolean> => {
        const response = await api.user.contracts.zip_archive.check(archiveId);

        if (response.ok) {
          if (response.status === HttpStatusCode.NO_CONTENT) {
            return true;
          }
          handle(
            new Error(
              `Unknown success code ${response.status} for OPTION request to contract's zip_archive endpoint.`,
            ),
          );
        }

        return false;
      },
      get: async (archiveId: string): Promise<true | void> => {
        try {
          const response = api.user.contracts.zip_archive.get(archiveId);
          buildArchiveFromBlob('contracts.zip', await response);
          return true;
        } catch (error) {
          handle(error);
        }

        // FIXME: two thing could happen here with HttpStatusCode.NOT_FOUND response:
        // * nothing found because the zip is generating.
        // * nothing found because the zip doesn't and will never exist.
      },
      create: async (organizationId: string): Promise<string> => {
        const response = await api.user.contracts.zip_archive.create({
          organization_id: organizationId,
        });

        return extractArchiveId(response.url);
      },
    },
  };
};

export default useContractArchive;
