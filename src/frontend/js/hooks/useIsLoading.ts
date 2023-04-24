import { useEffect, useRef, useState } from 'react';

const useIsLoading = (loadingStates: boolean[], delayInMillisecond = 500) => {
  const [isLoading, setIsLoading] = useState<boolean>(!loadingStates.every((v) => v === false));
  const timerIdRef = useRef<ReturnType<typeof setTimeout>>();
  const [canStopLoading, setCanStopLoading] = useState(true);

  const startLoading = () => {
    setCanStopLoading(false);
    setIsLoading(true);
    timerIdRef.current = setTimeout(() => {
      setCanStopLoading(true);
    }, delayInMillisecond);
  };

  const stopLoading = () => {
    setIsLoading(false);
    clearTimeout(timerIdRef.current);
    timerIdRef.current = undefined;
  };

  // clear timeout on unmount
  useEffect(() => timerIdRef.current && clearTimeout(timerIdRef.current), []);

  useEffect(() => {
    const newIsLoading = !loadingStates.every((v) => v === false);
    if (newIsLoading && !timerIdRef.current) {
      startLoading();
    }
  }, [loadingStates, timerIdRef.current]);

  useEffect(() => {
    const newIsLoading = !loadingStates.every((v) => v === false);
    if (isLoading && !newIsLoading && canStopLoading) {
      stopLoading();
    }
  }, [loadingStates, isLoading, canStopLoading]);

  return isLoading;
};

export default useIsLoading;
