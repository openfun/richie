import { useRef, useEffect, useState } from 'react';
import { iframeResizer } from 'iframe-resizer';
import { LtiConsumerContext, LtiConsumerProps } from 'types/LtiConsumer';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { handle } from 'utils/errors/handle';

const LtiConsumer = ({ id }: LtiConsumerProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [context, setContext] = useState<LtiConsumerContext>();

  const checkResponseStatus = (response: Response) => {
    if (!response.ok) {
      throw new Error(`Failed to retrieve LTI consumer context at placeholder ${id}`);
    }
    return response.json();
  };

  useAsyncEffect(async () => {
    await fetch(`/api/v1.0/plugins/lti-consumer/${id}/context/`)
      .then(checkResponseStatus)
      .then(setContext)
      .catch(handle);
  }, []);

  useEffect(() => {
    if (context) {
      formRef.current?.submit();
      if (context.is_automatic_resizing) {
        // Retrieve and inject current component container height to prevent flickering
        // and remove aspect-ratio trick which is not compatible with iframeResizer
        const componentContainer = formRef.current?.closest('.richie-react--lti-consumer');
        iframeResizer({ minHeight: componentContainer?.clientHeight }, iframeRef.current!);
        componentContainer?.classList.remove('aspect-ratio');
        componentContainer?.attributes.removeNamedItem('style');
      }
    }
  }, [context]);

  if (!context) return <div className="lti-consumer" />;

  return (
    <div className="lti-consumer">
      <form
        ref={formRef}
        action={context.url}
        method="POST"
        encType="application/x-www-form-urlencoded"
        target={`lti_iframe_${id}`}
      >
        {Object.entries(context.content_parameters).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <iframe
        ref={iframeRef}
        name={`lti_iframe_${id}`}
        title={context.url}
        src={context.url}
        allow="microphone *; camera *; midi *; geolocation *; encrypted-media *; fullscreen *"
        allowFullScreen
      />
    </div>
  );
};

export default LtiConsumer;
