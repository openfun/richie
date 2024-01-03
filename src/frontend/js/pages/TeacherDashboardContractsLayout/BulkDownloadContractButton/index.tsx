import { Button } from '@openfun/cunningham-react';
import { useRef, useState, useEffect } from 'react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Spinner } from 'components/Spinner';
import { AuthenticationApi } from 'api/authentication';
import { getAPIEndpoint } from 'api/joanie';

const BulkDownloadContractButton = ({ organizationId }: { organizationId: string }) => {
  const api = useJoanieApi();
  const [urlArchive, setArchiveUrl] = useState<string | null>(
    localStorage.getItem('contractZipUrl'),
  );
  const timeoutRef = useRef<NodeJS.Timeout>();

  const askToDownload = async () => {
    const { url } = await api.user.contracts.zip_archive.create({
      organization_id: organizationId,
    });
    localStorage.setItem('contractZipUrl', url);
    setArchiveUrl(url);
  };

  const fetchArchive = async () => {
    const accessToken = AuthenticationApi!.accessToken!();
    const $html = document.querySelector('html');
    const language = $html?.getAttribute('lang') || 'en-US';
    fetch('https://dev-jbpenrath-joanie.loca.lt' + urlArchive!, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept-Language': language,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }

        if (response.status === 404) {
          startPoll();
        }
      })
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contracts.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        localStorage.removeItem('contractZipUrl');
        setArchiveUrl(null);
      });
  };

  const startPoll = () => {
    timeoutRef.current = setTimeout(fetchArchive, 1000);
  };

  useEffect(() => {
    if (urlArchive) {
      fetchArchive();
    }
  }, [urlArchive]);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
    },
    [],
  );

  if (urlArchive) {
    return <Spinner aria-labelledby="Waiting for archive" />;
  }

  return (
    <Button
      onClick={askToDownload}
      color="secondary"
      size="small"
      icon={<span className="material-icons">download</span>}
    >
      Download all signed contracts
    </Button>
  );
};

export default BulkDownloadContractButton;
