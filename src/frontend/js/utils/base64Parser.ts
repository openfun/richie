/*
Utils to manage the "Unicode Problem".
Since DOMStrings are 16-bit-encoded strings, in most
browsers calling window.btoa on a Unicode string will cause a Character Out Of
Range exception if a character exceeds the range of a 8-bit byte (0x00~0xFF).

Full explanation and solution from this article : 
https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
*/

// Encoding UTF8 ⇢ base64

export function base64Encode(value: string) {
  return btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }),
  );
}

// Decoding base64 ⇢ UTF8

export function base64Decode(value: string) {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(value), (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );
}
