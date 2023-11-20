/**
 * /!\ DO NOT EDIT /!\
 *
 * This file is the Lex Persona SDK. They do not have any NPM dependency, so we had to integrate
 * this library directly to our source code.
 */
!(function (e, n) {
  typeof exports === 'object' && typeof module === 'object'
    ? (module.exports = n())
    : typeof define === 'function' && define.amd
    ? define([], n)
    : typeof exports === 'object'
    ? (exports.iframeManager = n())
    : (e.iframeManager = n());
})(window, function () {
  return (function (e) {
    function n(r) {
      if (o[r]) return o[r].exports;
      const t = (o[r] = { exports: {}, id: r, loaded: !1 });
      return e[r].call(t.exports, t, t.exports, n), (t.loaded = !0), t.exports;
    }

    var o = {};
    return (n.m = e), (n.c = o), (n.p = ''), n(0);
  })([
    function (e, n) {
      function o() {
        a && (a(), (a = null));
      }

      function r() {
        c ||
          ((c = document.createElement('style')),
          (c.innerHTML = '.' + i + ' { overflow: hidden; }'),
          document.getElementsByTagName('head')[0].appendChild(c));
      }

      function t(e, n) {
        return void 0 === n
          ? e
          : typeof e !== 'object'
          ? n
          : (Object.keys(n).forEach(function (o) {
              void 0 === e[o] ? (e[o] = n[o]) : (e[o] = t(e[o], n[o]));
            }),
            e);
      }

      var i = 'iframe-manager-open';
      var a = null;
      n.open = function (e, n, c) {
        function f(f, s) {
          function d(e) {
            o(), f && f(e), c(null, e);
          }

          function l(e) {
            o(), s && s(e), c(e);
          }

          function u(e) {
            const n = e && e.trim().split('/');
            if (!n || !n[0] || n[1] || !n[2]) return l(new Error('Malformed or missing URL'));
            const o = n[0].toLowerCase();
            let r = o + '//' + n[2].toLowerCase();
            return (
              o === 'http'
                ? (r = r.replace(/:80$/, ''))
                : o === 'https' && (r = r.replace(/:443$/, '')),
              r
            );
          }

          (c = typeof c === 'function' ? c : typeof n === 'function' ? n : function () {}),
            (n = typeof n === 'object' ? n : typeof e === 'object' ? e : {}),
            (e = typeof e === 'string' ? e : typeof n.url === 'string' ? n.url : ''),
            (n = t(
              {
                iframe: !0,
                iframeProps: {
                  width: '100%',
                  height: '100%',
                  frameBorder: 0,
                  allowTransparency: 'true',
                },
                iframeStyle: { position: 'fixed', top: '0', left: '0', zIndex: 9999 },
              },
              n,
            ));
          const m = u(window.location.href);
          const p = u(e);
          const w = e.split('#');
          let y = w[0].indexOf('?') === -1 ? '?' : '&';
          (y += n.iframe ? 'iframeParentOrigin=' : 'windowParentOrigin='),
            (e = w[0] + y + encodeURIComponent(m));
          const g = Math.random().toString(36).slice(2);
          w.length > 1
            ? ((w[0] = ''), (e += w.join('#') + '&parentChallenge=' + g))
            : (e += '#parentChallenge=' + g);
          let h;
          let v = null;
          let b = null;
          let E = null;
          if (n.iframe)
            (v = document.createElement('iframe')),
              Object.keys(n.iframeProps).forEach(function (e) {
                v[e] = n.iframeProps[e];
              }),
              Object.keys(n.iframeStyle).forEach(function (e) {
                v.style[e] = n.iframeStyle[e];
              }),
              (v.onerror = function () {
                l(new Error('unknown_error'));
              }),
              (v.onload = function () {
                h.postMessage(g, p);
              }),
              (v.src = e),
              document.body.appendChild(v),
              r(),
              (document.body.className += ' ' + i),
              (h = v.contentWindow),
              (a = function () {
                document.body.removeChild(v),
                  removeEventListener('message', E),
                  (document.body.className = window.document.body.className.replace(
                    new RegExp('(?:^|\\s)' + i + '(?!\\S)'),
                    '',
                  ));
              });
          else {
            if (((h = window.open(e, Math.random().toString(36).substring(2))), !h))
              throw new Error('The authorize window was blocked.');
            a = function () {
              clearInterval(b), h.closed || h.close(), window.removeEventListener('message', E);
            };
          }
          (E = function (e) {
            const n = u(e.origin);
            e.source === h &&
              n === p &&
              (e.data === 'error' ? l(new Error('Unknown error')) : d(e.data));
          }),
            window.addEventListener('message', E),
            n.iframe ||
              (b = setInterval(function () {
                h.closed && l(new Error('Window closed'));
              }, 250));
        }

        o();
        const s = window.Promise ? new Promise(f) : f();
        return t(s || {}, { clean: o });
      };
      let c;
    },
  ]);
});
