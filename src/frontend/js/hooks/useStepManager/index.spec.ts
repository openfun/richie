import { act, renderHook } from '@testing-library/react';
import { Manifest, useStepManager } from '.';

describe('useStepManager', () => {
  it('reads the manifest', () => {
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

    // - step 0
    expect(result.current.step).toEqual('step0');

    // - step 1
    act(() => result.current.next());
    expect(result.current.step).toEqual('step1');

    // - terminated state
    act(() => result.current.next());
    expect(result.current.step).toEqual(null);

    // As state is terminated, trigger once again next should do nothing
    act(() => result.current.next());
    expect(result.current.step).toEqual(null);
  });

  it('is able to reset the step process', () => {
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

    // - step 0
    expect(result.current.step).toEqual('step0');

    // - step 1
    act(() => result.current.next());
    expect(result.current.step).toEqual('step1');

    // - Reset: should go back to step0
    act(() => result.current.reset());
    expect(result.current.step).toEqual('step0');
  });

  it('is able to find the first step through steps if manifest does not have a start property', () => {
    type LastStep = 'finally';
    type Steps = 'first' | 'then' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      steps: {
        then: {
          next: 'finally',
        },
        first: {
          next: 'then',
        },
        finally: {
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));

    expect(result.current.firstStep).toEqual('first');

    // - first
    expect(result.current.step).toEqual('first');

    // - then
    act(() => result.current.next());
    expect(result.current.step).toEqual('then');

    // - finally
    act(() => result.current.next());
    expect(result.current.step).toEqual('finally');

    // - Reset: should go back to first
    act(() => result.current.reset());
    expect(result.current.step).toEqual('first');
  });

  it('triggers onEnter and onExit hooks on step transition', () => {
    type LastStep = 'step1';
    type Steps = 'step0' | LastStep;
    const manifest: Manifest<Steps, LastStep> = {
      start: 'step0',
      steps: {
        step0: {
          next: 'step1',
          onEnter: jest.fn(),
          onExit: jest.fn(),
        },
        step1: {
          next: null,
          onEnter: jest.fn(),
          onExit: jest.fn(),
        },
      },
    };
    const { result } = renderHook(() => useStepManager(manifest));

    // - step 0
    expect(result.current.step).toEqual('step0');
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).not.toHaveBeenCalled();
    expect(manifest.steps.step1.onEnter).not.toHaveBeenCalled();
    expect(manifest.steps.step1.onExit).not.toHaveBeenCalled();

    // - step 1
    act(() => result.current.next());

    expect(result.current.step).toEqual('step1');
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).not.toHaveBeenCalled();

    // - terminated state
    act(() => result.current.next());

    expect(result.current.step).toEqual(null);
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - Reset: go back to step0
    act(() => result.current.reset());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - step 1
    act(() => result.current.next());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - Reset: go back to step0
    act(() => result.current.reset());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(3);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(2);
  });
});
