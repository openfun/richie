/*
  An utility to decode/encode string into base 64.
  Basic atob|btoa functions does not support UTF16 characters

  The function below are coming from the solution of this issue:
  https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
*/

export function b2a(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(Number(`0x${p1}`));
    }),
  );
}

export function a2b(str: string) {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}
