import {
  act,
  getAllByRole,
  getByText,
  queryAllByTestId,
  render,
  renderHook,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { IconTypeEnum } from 'components/Icon';
import { type Manifest, useStepManager } from 'hooks/useStepManager';
import { StepBreadcrumb } from '.';

describe('StepBreadcrumb', () => {
  const Wrapper = ({ children }: React.PropsWithChildren<{}>) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  it('renders visually a minimal manifest', () => {
    // If manifest's steps does not have `label` and `icon` property,
    // only a breadcrumb with the step index is displayed.
    type LastStep = 'step1';
    type Steps = 'step0' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      start: 'step0',
      steps: {
        step0: {
          next: 'step1',
        },
        step1: {
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container, rerender } = render(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const labels = queryAllByTestId(container, 'StepBreadcrumb__step__label');
    const stepsIcons = queryAllByTestId(container, 'StepBreadcrumb__step__icon');
    let activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    let currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(labels).toHaveLength(0);
    expect(stepsIcons).toHaveLength(2);
    stepsIcons.forEach((icon, index) => {
      expect(icon.firstChild).toBeInstanceOf(HTMLSpanElement);
      expect(icon.firstChild).toHaveTextContent((index + 1).toString());
    });
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('1');
    expect(currentStep).toHaveAttribute('tabindex', '-1');

    act(() => result.current.next());
    rerender(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    currentStep = container.querySelector('li.StepBreadcrumb__step.StepBreadcrumb__step--current');
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('2');
  });

  it('renders visually a complete manifest', () => {
    // If manifest's steps has `label` and `icon` property,
    // this information was shown.
    type LastStep = 'step1';
    type Steps = 'step0' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      start: 'step0',
      steps: {
        step0: {
          label: '0. Step',
          icon: IconTypeEnum.ARROW_RIGHT,
          next: 'step1',
        },
        step1: {
          label: '1. Step',
          icon: IconTypeEnum.ARROW_RIGHT,
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container, rerender } = render(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const stepsIcons = queryAllByTestId(container, 'StepBreadcrumb__step__icon');
    let activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    let currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );

    const currentStepLabel = getByText(container, '0. Step', { exact: true });
    const nextStepLabel = getByText(container, '1. Step', { exact: true });

    expect(stepsIcons).toHaveLength(2);
    stepsIcons.forEach((icon) => {
      expect(icon.firstChild).toBeInstanceOf(SVGElement);
    });
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('0. Step');
    // there should be hidden text that make things more explicit for screen reader users
    expect(currentStepLabel?.querySelector('.offscreen')).toHaveTextContent('Step 1 of 2 (active)');
    expect(nextStepLabel?.querySelector('.offscreen')).toHaveTextContent('Step 2 of 2');
    // the current step should be programmatically focusable
    expect(currentStep).toHaveAttribute('tabindex', '-1');
    const separator = container.querySelectorAll('li.StepBreadcrumb__separator');
    let activeSeparator = container.querySelector(
      'li.StepBreadcrumb__separator.StepBreadcrumb__separator--active',
    );
    expect(separator).toHaveLength(1);
    expect(activeSeparator).toBeNull();

    act(() => result.current.next());
    rerender(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    currentStep = container.querySelector('li.StepBreadcrumb__step.StepBreadcrumb__step--current');
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('1. Step');

    activeSeparator = container.querySelector(
      'li.StepBreadcrumb__separator.StepBreadcrumb__separator--active',
    );
    expect(activeSeparator).not.toBeNull();
  });

  it('sorts manifest steps to guarantee the display order of steps', () => {
    type LastStep = 'step0';
    type Steps = 'step1' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      start: 'step1',
      steps: {
        step0: {
          next: null,
        },
        step1: {
          next: 'step0',
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container } = render(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    const currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('1');
  });

  it('displays all active steps on mount if manifest does not start to the first step', () => {
    type LastStep = 'step1';
    type Steps = 'step0' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      start: 'step1',
      steps: {
        step0: {
          next: 'step1',
        },
        step1: {
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container } = render(
      <Wrapper>
        <StepBreadcrumb manifest={manifest} step={result.current.step} />
      </Wrapper>,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    const currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('2');
  });

  it('can contain a single step ', () => {
    type LastStep = 'step0';
    const manifest: Manifest<LastStep> = {
      steps: {
        step0: {
          next: null,
        },
      },
      start: 'step0',
    };

    const { result } = renderHook(() => useStepManager(manifest));
    // - step 0
    expect(result.current.step).toEqual('step0');
    // - terminated state
    act(() => result.current.next());
    expect(result.current.step).toEqual(null);
    // - Reset: should go back to step0
    act(() => result.current.reset());
    expect(result.current.step).toEqual('step0');
  });
});
