import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { DjangoCMSPluginsInit, DjangoCMSTemplate } from 'components/DjangoCMSTemplate/index';

describe('DjangoCMSTemplate', () => {
  afterEach(() => {
    window.CMS = undefined;
  });

  it('renders a template when in draft mode and initializes', async () => {
    const initMock = jest.fn();
    window.CMS = {
      config: {
        mode: 'draft',
      },
      Plugin: {
        _initializeTree: initMock,
      },
    } as any;

    const Wrapper = () => {
      useEffect(() => {
        DjangoCMSPluginsInit();
      }, []);
      return <DjangoCMSTemplate plugin="plugin">Hello world</DjangoCMSTemplate>;
    };

    expect(initMock).not.toHaveBeenCalled();
    render(<Wrapper />);
    const expected = `<div id=\"modal-exclude\"></div><div><template class="cms-plugin cms-plugin-start plugin"></template>Hello world<template class="cms-plugin cms-plugin-end plugin"></template></div>`;
    expect(document.body.innerHTML).toEqual(expected);
    await waitFor(() => expect(initMock).toHaveBeenCalled());
  });
  it('does not render templates when not in draft mode', async () => {
    const Wrapper = () => {
      useEffect(() => {
        DjangoCMSPluginsInit();
      }, []);
      return <DjangoCMSTemplate plugin="plugin">Hello world</DjangoCMSTemplate>;
    };

    render(<Wrapper />);
    const expected = `<div id=\"modal-exclude\"></div><div>Hello world</div>`;
    expect(document.body.innerHTML).toEqual(expected);
  });
});
