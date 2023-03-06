import { IFrameComponent, IFrameOptions } from 'iframe-resizer';

declare module 'iframe-resizer' {
  function iframeResize(options: IFrameOptions, target: string | HTMLElement): IFrameComponent[];
}
