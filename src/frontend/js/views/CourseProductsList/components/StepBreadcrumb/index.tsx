// StepBreadcrumb has been created to work in pair with useStepManager hook.
// Within a step process, it aims to guide the user to know where he/she is in
// the current process by translating visually the steps manifest.
import { Children, FC, Fragment, useMemo } from 'react';
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

  return (
    <ol className="StepBreadcrumb">
      {Children.toArray(
        orderedSteps.map(([, entry], index) => (
          <Fragment>
            <Step
              {...entry}
              isActive={index <= activeIndex}
              isCurrent={index === activeIndex}
              position={index + 1}
            />
            {entry.next !== null && <Separator isActive={index < activeIndex} />}
          </Fragment>
        )),
      )}
    </ol>
  );
};

type SeparatorProps = { isActive: boolean };
const Separator: FC<SeparatorProps> = ({ isActive }) => {
  const classNames = useMemo(() => {
    const className = ['StepBreadcrumb__separator'];
    if (isActive) className.push('StepBreadcrumb__separator--active');

    return className.join(' ');
  }, [isActive]);
  return <li aria-hidden={true} className={classNames} />;
};

type StepProps = { isActive: boolean; isCurrent: boolean; position: number } & Step;
const Step: FC<StepProps> = ({ isActive, isCurrent, position, icon, label, next }) => {
  const classNames = useMemo(() => {
    const className = ['StepBreadcrumb__step'];
    if (isActive) className.push('StepBreadcrumb__step--active');
    if (isCurrent) className.push('StepBreadcrumb__step--current');

    return className.join(' ');
  }, [isActive, isCurrent]);

  return (
    <li aria-current={isCurrent ? 'step' : 'false'} className={classNames}>
      <div className="StepBreadcrumb__step__icon" data-testid="StepBreadcrumb__step__icon">
        {icon ? <Icon name={icon} /> : <span>{position}</span>}
      </div>
      {label && (
        <strong
          className="h6 StepBreadcrumb__step__label"
          data-testid="StepBreadcrumb__step__label"
        >
          {label}
        </strong>
      )}
    </li>
  );
};
