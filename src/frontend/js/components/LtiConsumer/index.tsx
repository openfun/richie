import React, { useEffect } from 'react';
import { iframeResizer } from 'iframe-resizer';
import { LtiConsumer as LtiConsumerProps } from 'types/LtiConsumer';

const LtiConsumer = ({
  url,
  content_parameters: contentParameters,
  automatic_resizing,
}: LtiConsumerProps) => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    formRef.current?.submit();
    if (automatic_resizing) {
      // Retrieve and inject current component container height to prevent flickering
      // and remove aspect-ratio trick which is not compatible with iframeResizer
      const componentContainer = document.querySelector('.richie-react--lti-consumer');
      iframeResizer({ minHeight: componentContainer?.clientHeight }, iframeRef.current!);
      componentContainer?.classList.remove('aspect-ratio');
      componentContainer?.attributes.removeNamedItem('style');
    }
  }, []);

  return (
    <div className="lti-consumer">
      <form
        id="lti_form"
        ref={formRef}
        action={url}
        method="POST"
        encType="application/x-www-form-urlencoded"
        target="lti_iframe"
        style={{ display: 'none' }}
      >
        {Object.entries(contentParameters).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <iframe
        ref={iframeRef}
        name="lti_iframe"
        title={url}
        src={url}
        allow="microphone *; camera *; midi *; geolocation *; encrypted-media *; fullscreen *"
        allowFullScreen
      />
    </div>
  );
};

export default LtiConsumer;
