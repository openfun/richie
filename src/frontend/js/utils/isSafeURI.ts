import { location } from 'utils/indirection/window';

const REDIRECT_WHITELIST =
  (window as any).__richie_frontend_context__?.context?.redirect_whitelist || [];

/*
  Get this function from OpenEDX which takes itself from this issue:
  http://stackoverflow.com/questions/6238351/fastest-way-to-detect-external-urls
*/
const isExternal = (url: string) => {
  // parse the url into protocol, host, path, query, and fragment. More information can be found here: http://tools.ietf.org/html/rfc3986#appendix-B
  const match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/) || [];
  // match[1] matches a protocol if one exists in the url
  // if the protocol in the url does not match the protocol in the window's location, this url is considered external
  if (
    typeof match[1] === 'string' &&
    match[1].length > 0 &&
    match[1].toLowerCase() !== location.protocol
  ) {
    return true;
  }
  // match[2] matches the host if one exists in the url
  // if the host in the url does not match the host of the window location, this url is considered external
  if (
    typeof match[2] === 'string' &&
    match[2].length > 0 &&
    // this regex removes the port number if it patches the current location's protocol
    ((location.protocol === 'http:' &&
      match[2].replace(new RegExp(':(80)?$'), '') !== location.host) ||
      (location.protocol === 'https:' &&
        match[2].replace(new RegExp(':(443)?$'), '') !== location.host))
  ) {
    return true;
  }
  return false;
};

/**
 * Util to check if an uri is safe.
 * Safe means the uri is an internal uri or an external uri which its hostname
 * is present in REDIRECT_WHITELIST variable.
 *
 * @param uri the uri to check
 *
 */
export const isSafeURI = (uri: string): boolean => {
  const url = new URL(uri);

  if (!isExternal(uri)) {
    return true;
  }

  if (REDIRECT_WHITELIST.length > 0) {
    if (REDIRECT_WHITELIST.length === 1 && REDIRECT_WHITELIST[0] === '*') {
      return true;
    }

    if (url && isExternal(uri)) {
      if (REDIRECT_WHITELIST.includes(url.hostname)) {
        return true;
      }
    }
  }

  return false;
};
