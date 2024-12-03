"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[15711],{71998:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>r,contentTitle:()=>l,default:()=>h,frontMatter:()=>c,metadata:()=>i,toc:()=>a});const i=JSON.parse('{"id":"tls-connection","title":"Connecting Richie and OpenEdX over TLS for development","description":"Purpose","source":"@site/versioned_docs/version-2.17.0/tls-connection.md","sourceDirName":".","slug":"/tls-connection","permalink":"/docs/2.17.0/tls-connection","draft":false,"unlisted":false,"tags":[],"version":"2.17.0","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1666962873000,"frontMatter":{"id":"tls-connection","title":"Connecting Richie and OpenEdX over TLS for development","sidebar_label":"TLS connection for development"}}');var o=t(74848),s=t(28453);const c={id:"tls-connection",title:"Connecting Richie and OpenEdX over TLS for development",sidebar_label:"TLS connection for development"},l=void 0,r={},a=[{value:"Purpose",id:"purpose",level:2},{value:"Run OpenEdx and Richie on sibling domains",id:"run-openedx-and-richie-on-sibling-domains",level:2},{value:"Enable TLS",id:"enable-tls",level:2},{value:"1. Install mkcert and its Certificate Authority",id:"1-install-mkcert-and-its-certificate-authority",level:3},{value:"a. Install <code>mkcert</code> on your local machine",id:"a-install-mkcert-on-your-local-machine",level:4},{value:"b. Install Mkcert Certificate Authority",id:"b-install-mkcert-certificate-authority",level:4},{value:"2. On Richie",id:"2-on-richie",level:3},{value:"3. On OpenEdx",id:"3-on-openedx",level:3},{value:"4. Start Richie and OpenEdx over SSL",id:"4-start-richie-and-openedx-over-ssl",level:3}];function d(e){const n={a:"a",blockquote:"blockquote",code:"code",em:"em",h2:"h2",h3:"h3",h4:"h4",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.h2,{id:"purpose",children:"Purpose"}),"\n",(0,o.jsxs)(n.p,{children:["By default in the docker-compose environment for development, Richie is hosted on ",(0,o.jsx)(n.code,{children:"localhost:8070"}),"\nand uses a fake LMS backend (",(0,o.jsx)(n.code,{children:"base.BaseLMSBackend"}),") as you can see if you check the\n",(0,o.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," setting in ",(0,o.jsx)(n.code,{children:"env.d/development"}),"."]}),"\n",(0,o.jsx)(n.p,{children:"This base backend uses session storage to fake enrollments to course runs."}),"\n",(0,o.jsx)(n.p,{children:"If you want to test real enrollments to an OpenEdX instance hosted on an external domain, OpenEdX\nwill need to generate a CORS CSRF Cookie. This cookie is flagged as secure, which implies that\nwe are not able to use it without SSL connections."}),"\n",(0,o.jsx)(n.p,{children:"So if you need to use the OpenEdx API to Create, Update or Delete data from Richie, you have to\nenable SSL on Richie and OpenEdx on your development environment, which requires a little bit more\nconfiguration. Below, we explain how to serve OpenEdx and Richie over SSL."}),"\n",(0,o.jsx)(n.h2,{id:"run-openedx-and-richie-on-sibling-domains",children:"Run OpenEdx and Richie on sibling domains"}),"\n",(0,o.jsxs)(n.p,{children:["Richie and OpenEdx must be on sibling domains ie domains that both are subdomains of the same\nparent domain, because sharing secure Cookies on ",(0,o.jsx)(n.code,{children:"localhost"})," or unrelated domains is blocked.\nTo do that, you have to edit your hosts file (",(0,o.jsx)(n.em,{children:".e.g"})," ",(0,o.jsx)(n.code,{children:"/etc/hosts"})," on a *NIX system) to alias a\ndomain ",(0,o.jsx)(n.code,{children:"local.dev"})," with two subdomains ",(0,o.jsx)(n.code,{children:"richie"})," and ",(0,o.jsx)(n.code,{children:"edx"})," pointing to ",(0,o.jsx)(n.code,{children:"localhost"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"# /etc/hosts\n127.0.0.1 richie.local.dev\n127.0.0.1 edx.local.dev\n"})}),"\n",(0,o.jsxs)(n.p,{children:["Once this has been done, the OpenEdx app should respond on ",(0,o.jsx)(n.a,{href:"http://edx.local.dev:8073",children:"http://edx.local.dev:8073"}),"\nand Richie should respond on ",(0,o.jsx)(n.a,{href:"http://richie.local.dev:8070",children:"http://richie.local.dev:8070"}),". The Richie application should now be\nable to make CORS XHR requests to the OpenEdX application."]}),"\n",(0,o.jsx)(n.h2,{id:"enable-tls",children:"Enable TLS"}),"\n",(0,o.jsxs)(n.p,{children:["If you want to develop with OpenEdx as LMS backend of the Richie application (see the\n",(0,o.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," setting), you need to enable TLS for your development servers.\nBoth Richie and OpenEdx use Nginx as reverse proxy which eases the SSL setup."]}),"\n",(0,o.jsx)(n.h3,{id:"1-install-mkcert-and-its-certificate-authority",children:"1. Install mkcert and its Certificate Authority"}),"\n",(0,o.jsxs)(n.p,{children:["First you will need to install mkcert and its Certificate Authority.\n",(0,o.jsx)(n.a,{href:"https://mkcert.org/",children:"mkcert"})," is a little util to ease local certificate generation."]}),"\n",(0,o.jsxs)(n.h4,{id:"a-install-mkcert-on-your-local-machine",children:["a. Install ",(0,o.jsx)(n.code,{children:"mkcert"})," on your local machine"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"https://github.com/FiloSottile/mkcert",children:"Read the doc"})}),"\n",(0,o.jsxs)(n.li,{children:["Linux users who do not want to use linuxbrew : ",(0,o.jsx)(n.a,{href:"https://www.prado.lt/how-to-create-locally-trusted-ssl-certificates-in-local-development-environment-on-linux-with-mkcert",children:"read this article"}),"."]}),"\n"]}),"\n",(0,o.jsx)(n.h4,{id:"b-install-mkcert-certificate-authority",children:"b. Install Mkcert Certificate Authority"}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.code,{children:"mkcert -install"})}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["If you do not want to use mkcert, you can generate ",(0,o.jsx)(n.a,{href:"https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/",children:"CA and certificate with openssl"}),".\nYou will have to put your certificate and its key in the ",(0,o.jsx)(n.code,{children:"docker/files/etc/nginx/ssl"})," directory\nand respectively name them ",(0,o.jsx)(n.code,{children:"richie.local.dev.pem"})," and ",(0,o.jsx)(n.code,{children:"richie.local.dev.key"}),"."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"2-on-richie",children:"2. On Richie"}),"\n",(0,o.jsx)(n.p,{children:"Then, to setup the SSL configuration with mkcert, run our helper script:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"$ bin/setup-ssl\n"})}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["If you do not want to use mkcert, read the instructions above to generate a Richie certificate,\nand run the helper script with the ",(0,o.jsx)(n.code,{children:"--no-cert"})," option:"]}),"\n"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"bin/setup-ssl --no-cert\n"})}),"\n",(0,o.jsx)(n.h3,{id:"3-on-openedx",children:"3. On OpenEdx"}),"\n",(0,o.jsxs)(n.p,{children:["In the same way, you also have to enable SSL in OpenEdx, by updating the Nginx configuration.\nRead how to ",(0,o.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker/blob/master/docs/richie-configuration.md#richie-configuration",children:"enable SSL on OpenEdx"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["Once this has been done, the OpenEdx app should respond on ",(0,o.jsx)(n.a,{href:"https://edx.local.dev:8073",children:"https://edx.local.dev:8073"}),"\nand Richie should respond on ",(0,o.jsx)(n.a,{href:"https://richie.local.dev:8070",children:"https://richie.local.dev:8070"}),". The richie application should be able\nto share cookies with the OpenEdx application to allow CORS CSRF Protected XHR requests."]}),"\n",(0,o.jsx)(n.h3,{id:"4-start-richie-and-openedx-over-ssl",children:"4. Start Richie and OpenEdx over SSL"}),"\n",(0,o.jsxs)(n.p,{children:["Now, the OpenEdx application should respond on ",(0,o.jsx)(n.a,{href:"https://edx.local.dev:8073",children:"https://edx.local.dev:8073"}),", and Richie\non ",(0,o.jsx)(n.a,{href:"https://richie.local.dev:8070",children:"https://richie.local.dev:8070"})," without browser warning about the certificate validity."]}),"\n",(0,o.jsx)(n.p,{children:"You need to follow these steps once. The next time you want to use SSL, you can run the following\ncommand on both the Richie and OpenEdX projects:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"$ make run-ssl\n"})}),"\n",(0,o.jsx)(n.p,{children:"Of course, you can still run apps without ssl by using:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"$ make run\n"})})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},28453:(e,n,t)=>{t.d(n,{R:()=>c,x:()=>l});var i=t(96540);const o={},s=i.createContext(o);function c(e){const n=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:c(e.components),i.createElement(s.Provider,{value:n},e.children)}}}]);