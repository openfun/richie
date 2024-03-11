import { useEffect, useMemo, useState } from 'react';
import { IconTypeEnum } from 'components/Icon';
import { type Nullable } from 'types/utils';

export interface Step<Keys extends PropertyKey = PropertyKey> {
  icon?: IconTypeEnum;
  label?: string;
  next: Nullable<Keys>;
  onEnter?: Function;
  onExit?: Function;
}

type Steps<Keys extends PropertyKey> = Record<Keys, Step<Keys>>;

export interface Manifest<Keys extends PropertyKey> {
  steps: Steps<Keys>;
  start?: Keys;
}

/**
 * The first step of the manifest could be defined as the only step which is
 * never present in `next` property of another step.
 * So this method searches which step is not used by another step.
 * @param {Manifest} manifest
 * @returns {Manifest.step} step
 */
function findFirstStep<Keys extends PropertyKey>(manifest: Manifest<Keys>): Keys {
  const steps = Object.keys(manifest.steps) as Keys[];
  const nextSteps = Object.values<Step<Keys>>(manifest.steps).map(({ next }) => next);

  return steps.find((step) => !nextSteps.includes(step))!;
}

/**
 * A hook to manage step process.
 * It takes a manifest which describes each steps and how each of them
 * are related.
 * Callbacks `onEnter` and `onExit` can be defined to trigger function
 * when a step starts or terminates.
 *
 * Process terminates when step is null
 */
export const useStepManager = <Keys extends PropertyKey>(manifest: Manifest<Keys>) => {
  const firstStep = findFirstStep<Keys>(manifest);
  const [step, setStep] = useState<Nullable<Keys>>(manifest.start || firstStep);
  const currentStep = useMemo(() => (step ? manifest.steps[step] : null), [step]);

  const next = () => {
    if (step !== null) {
      const nextStep = manifest.steps[step].next;
      setStep(nextStep);
    }
  };

  useEffect(() => {
    if (currentStep?.onEnter) currentStep.onEnter();

    return () => {
      if (currentStep?.onExit) currentStep.onExit();
    };
  }, [currentStep]);

  const reset = () => {
    setStep(manifest.start || firstStep);
  };

  return { step, next, reset, firstStep };
};
