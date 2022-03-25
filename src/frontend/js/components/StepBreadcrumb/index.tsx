// StepBreadcrumb has been created to work in pair with useStepManager hook.
// Within a step process, it aims to guide the user to know where he/she is in
// the current process by translating visually the steps manifest.
import { Children, Fragment, useCallback } from 'react';
import { Nullable } from 'types/utils';
import { Manifest, Step, useStepManager } from 'hooks/useStepManager';
import { Icon } from 'components/Icon';

interface Props<Keys extends PropertyKey, LastKey extends Keys> {
  manifest: Manifest<Keys, LastKey>;
  step: Nullable<PropertyKey>;
}

type FlattenStep = [PropertyKey, Step];

/**
 * Retrieve the index of the active step.
 * When step is null, we know that process is terminated so we have to return
 * the last step index.
 * @params step[]
 * @returns {number} active step index
 */
function getActiveStepIndex(steps: FlattenStep[], step: Nullable<PropertyKey>) {
  if (step === null) return steps.length - 1;
  return steps.findIndex((s) => s[0] === step);
}

/**
 * As object properties order is not guaranteed, we have to sort steps to ensure
 * that they are displayed in the right order.
 *
 * // MARK When IE 11 supports will be dropped, we can use a `Map`
 * to define `manifest.steps` then remove this sort function
 */
function sortSteps<Keys extends PropertyKey, LastKey extends Keys>(
  firstStep: Keys,
  manifest: Manifest<Keys, LastKey>,
) {
  const steps: FlattenStep[] = [];
  let step = firstStep;

  while (step !== null) {
    steps.push([step, manifest.steps[step]]);
    step = manifest.steps[step].next;
  }

  return steps;
}

export const StepBreadcrumb = <Keys extends PropertyKey, LastKey extends Keys>({
  step,
  manifest,
}: Props<Keys, LastKey>) => {
  const { firstStep } = useStepManager(manifest);
  const orderedSteps = sortSteps(firstStep, manifest);
  const activeIndex = getActiveStepIndex(orderedSteps, step);

  const getStepClassName = useCallback(
    (index) => {
      const className = ['StepBreadcrumb__step'];
      if (index <= activeIndex) className.push('StepBreadcrumb__step--active');
      if (index === activeIndex) className.push('StepBreadcrumb__step--current');

      return className.join(' ');
    },
    [activeIndex],
  );

  const getSeparatorClassName = useCallback(
    (index) => {
      const className = ['StepBreadcrumb__separator'];
      if (index < activeIndex) className.push('StepBreadcrumb__separator--active');

      return className.join(' ');
    },
    [activeIndex],
  );

  return (
    <ol className="StepBreadcrumb">
      {Children.toArray(
        orderedSteps.map(([, entry], index) => (
          <Fragment>
            <li
              aria-current={index === activeIndex ? 'step' : 'false'}
              className={getStepClassName(index)}
            >
              <div className="StepBreadcrumb__step__icon" data-testid="StepBreadcrumb__step__icon">
                {entry.icon ? <Icon name={entry.icon} /> : <span>{index + 1}</span>}
              </div>
              {entry.label ? (
                <strong
                  className="h6 StepBreadcrumb__step__label"
                  data-testid="StepBreadcrumb__step__label"
                >
                  {entry.label}
                </strong>
              ) : null}
            </li>
            {entry.next !== null ? (
              <li aria-hidden={true} className={getSeparatorClassName(index)} />
            ) : null}
          </Fragment>
        )),
      )}
    </ol>
  );
};
