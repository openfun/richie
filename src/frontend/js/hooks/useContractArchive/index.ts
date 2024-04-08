import { useJoanieApi } from 'contexts/JoanieApiContext';
import { CourseProductRelation, Organization } from 'types/Joanie';
import { browserDownloadFromBlob } from 'utils/download';
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
        // FIXME: two thing could happen here with HttpStatusCode.NOT_FOUND response:
        // * nothing found because the zip is generating.
        // * nothing found because the zip doesn't and will never exist.
        const success = await browserDownloadFromBlob(() =>
          api.user.contracts.zip_archive.get(archiveId),
        );

        if (success) {
          return true;
        }
      },
      create: async (
        organizationId?: Organization['id'],
        courseProductRelationId?: CourseProductRelation['id'],
      ): Promise<string> => {
        const response = await api.user.contracts.zip_archive.create({
          organization_id: organizationId,
          course_product_relation_id: courseProductRelationId,
        });

        return extractArchiveId(response.url);
      },
    },
  };
};

export default useContractArchive;
