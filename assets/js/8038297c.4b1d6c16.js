"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[34779],{57293:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>d,contentTitle:()=>c,default:()=>h,frontMatter:()=>s,metadata:()=>r,toc:()=>a});var t=o(85893),i=o(11151);const s={id:"lms-connection",title:"Connecting Richie with an LMS",sidebar_label:"LMS connection"},c=void 0,r={id:"lms-connection",title:"Connecting Richie with an LMS",description:"richie can be connected to one or more Learning Management Systems (LMS) like OpenEdx, Moodle",source:"@site/versioned_docs/version-2.7.1/lms-connection.md",sourceDirName:".",slug:"/lms-connection",permalink:"/docs/2.7.1/lms-connection",draft:!1,unlisted:!1,tags:[],version:"2.7.1",lastUpdatedBy:"Mehdi Benadda",lastUpdatedAt:1655108611,formattedLastUpdatedAt:"Jun 13, 2022",frontMatter:{id:"lms-connection",title:"Connecting Richie with an LMS",sidebar_label:"LMS connection"},sidebar:"docs",previous:{title:"Frontend overrides",permalink:"/docs/2.7.1/frontend-overrides"},next:{title:"Contributing guide",permalink:"/docs/2.7.1/contributing-guide"}},d={},a=[{value:"API bridge",id:"api-bridge",level:3},{value:"Connecting Richie and OpenEdx over TLS",id:"connecting-richie-and-openedx-over-tls",level:2},{value:"Purpose",id:"purpose",level:4},{value:"Run OpenEdx and Richie on the same domain",id:"run-openedx-and-richie-on-the-same-domain",level:4},{value:"Enable TLS",id:"enable-tls",level:4},{value:"1. Install mkcert and its Certificate Authority",id:"1-install-mkcert-and-its-certificate-authority",level:5},{value:"a. Install <code>mkcert</code> on your local machine",id:"a-install-mkcert-on-your-local-machine",level:6},{value:"b. Install Mkcert Certificate Authority",id:"b-install-mkcert-certificate-authority",level:6},{value:"2. On Richie",id:"2-on-richie",level:5},{value:"3. On OpenEdx",id:"3-on-openedx",level:5},{value:"4. Start Richie and OpenEdx over SSL",id:"4-start-richie-and-openedx-over-ssl",level:5}];function l(e){const n={a:"a",blockquote:"blockquote",code:"code",em:"em",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"richie"})," can be connected to one or more Learning Management Systems (LMS) like OpenEdx, Moodle\nor Canvas for a seamless experience between browsing the course catalog on ",(0,t.jsx)(n.code,{children:"richie"})," and following\nthe course itself on the LMS."]}),"\n",(0,t.jsxs)(n.p,{children:["In order to connect ",(0,t.jsx)(n.code,{children:"richie"})," with a LMS, there is an API bridge\nto synchronize course information and enrollments."]}),"\n",(0,t.jsx)(n.h3,{id:"api-bridge",children:"API bridge"}),"\n",(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.code,{children:"APIHandler"})," utility acts as a proxy that routes queries to the correct LMS backend API,\nbased on a regex match on the URL of the course."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'RICHIE_LMS_BACKENDS=[\n    {\n        "BASE_URL": "https://www.lms-example2.org",\n        "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",\n        "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",\n        "JS_BACKEND": "openedx-hawthorn",\n        "JS_COURSE_REGEX": r"^.*/course/(.*)$",\n    },\n]\n'})}),"\n",(0,t.jsx)(n.p,{children:"For information about how to generate an API access on your OpenEdx instance, refer to the\ndocumentation."}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsxs)(n.em,{children:["Note: ",(0,t.jsx)(n.code,{children:"JS_BACKEND"})," accepts ",(0,t.jsx)(n.code,{children:"base"}),", ",(0,t.jsx)(n.code,{children:"openedx-dogwood"})," and ",(0,t.jsx)(n.code,{children:"openedx-hawthorn"})," values."]}),"\n",(0,t.jsx)(n.em,{children:"We have to implement several interfaces to be compatible to OpenEdx API:"}),"\n",(0,t.jsxs)(n.em,{children:[(0,t.jsx)(n.code,{children:"openedx-dogwood"})," has been tested with Dogwood and Eucalyptus versions."]}),"\n",(0,t.jsxs)(n.em,{children:[(0,t.jsx)(n.code,{children:"openedx-hawthorn"})," has been tested with Hawthorn and Ironwood versions."]}),"\n",(0,t.jsx)(n.em,{children:"If you encounter an issue with these API interfaces or need to have a new interface, propose a PR"}),"\n",(0,t.jsx)(n.em,{children:"or create an issue on our repository"})]}),"\n",(0,t.jsx)(n.h2,{id:"connecting-richie-and-openedx-over-tls",children:"Connecting Richie and OpenEdx over TLS"}),"\n",(0,t.jsx)(n.h4,{id:"purpose",children:"Purpose"}),"\n",(0,t.jsxs)(n.p,{children:["About the default configuration, if you check ",(0,t.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," settings in ",(0,t.jsx)(n.code,{children:"env.d/development"}),"\nyou will see that we use ",(0,t.jsx)(n.code,{children:"base.BaseLMSBackend"})," as ",(0,t.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"}),".\nIn fact, this base backend uses session storage to fake enrollment to course runs."]}),"\n",(0,t.jsx)(n.p,{children:"Maybe are you asking why? Because, to make Create/Update/Delete requests from an external domain,\nOpenEdx requires the use of a CORS CSRF Cookie. This cookie is flagged as secure, that means we are\nnot able to use it without a SSL connection."}),"\n",(0,t.jsx)(n.p,{children:"So if you need to use the OpenEdx API to Create, Update or Delete data from Richie, you have to\nenable SSL on Richie and OpenEdx on your development environment. So we need a little bit more\nconfiguration. Below, we explain how to serve OpenEdx and Richie over SSL."}),"\n",(0,t.jsx)(n.h4,{id:"run-openedx-and-richie-on-the-same-domain",children:"Run OpenEdx and Richie on the same domain"}),"\n",(0,t.jsxs)(n.p,{children:["Richie and OpenEdx must be on the same domain to work properly (Cookie security policy blocks\nsecure cookie sharing on localhost) To do that you have to edit your hosts file\n(",(0,t.jsx)(n.em,{children:".e.g"})," ",(0,t.jsx)(n.code,{children:"/etc/hosts"})," on a *NIX system) to alias a domain ",(0,t.jsx)(n.code,{children:"local.dev"})," with\ntwo subdomains ",(0,t.jsx)(n.code,{children:"richie"})," and ",(0,t.jsx)(n.code,{children:"edx"})," to localhost:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"# /etc/hosts\n127.0.0.1 richie.local.dev\n127.0.0.1 edx.local.dev\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Once this has been done, the OpenEdx app should respond on ",(0,t.jsx)(n.a,{href:"http://edx.local.dev:8073",children:"http://edx.local.dev:8073"}),"\nand Richie should respond on ",(0,t.jsx)(n.a,{href:"http://richie.local.dev:8070",children:"http://richie.local.dev:8070"})," and should be able\nto make CORS XHR requests."]}),"\n",(0,t.jsx)(n.h4,{id:"enable-tls",children:"Enable TLS"}),"\n",(0,t.jsxs)(n.p,{children:["If you want to develop with OpenEdx as ",(0,t.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," of Richie, you need to enable TLS for your\ndevelopment servers. Both Richie and OpenEdx use Nginx as reverse proxy that ease the SSL setup."]}),"\n",(0,t.jsx)(n.h5,{id:"1-install-mkcert-and-its-certificate-authority",children:"1. Install mkcert and its Certificate Authority"}),"\n",(0,t.jsxs)(n.p,{children:["First you will need to install mkcert and its Certificate Authority.\n",(0,t.jsx)(n.a,{href:"https://mkcert.org/",children:"mkcert"})," is a little util to ease local certificate generation."]}),"\n",(0,t.jsxs)(n.h6,{id:"a-install-mkcert-on-your-local-machine",children:["a. Install ",(0,t.jsx)(n.code,{children:"mkcert"})," on your local machine"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://github.com/FiloSottile/mkcert",children:"Read the doc"})}),"\n",(0,t.jsxs)(n.li,{children:["Linux users who do not want to use linuxbrew : ",(0,t.jsx)(n.a,{href:"https://www.prado.lt/how-to-create-locally-trusted-ssl-certificates-in-local-development-environment-on-linux-with-mkcert",children:"read this article"}),"."]}),"\n"]}),"\n",(0,t.jsx)(n.h6,{id:"b-install-mkcert-certificate-authority",children:"b. Install Mkcert Certificate Authority"}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.code,{children:"mkcert -install"})}),"\n",(0,t.jsxs)(n.blockquote,{children:["\n",(0,t.jsxs)(n.p,{children:["If you do not want to use mkcert, you can generate ",(0,t.jsx)(n.a,{href:"https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/",children:"CA and certificate with openssl"}),".\nYou will have to put your certificate and its key in ",(0,t.jsx)(n.code,{children:"docker/files/etc/nginx/ssl"})," directory\nand named them ",(0,t.jsx)(n.code,{children:"richie.local.dev.pem"})," and ",(0,t.jsx)(n.code,{children:"richie.local.dev.key"}),"."]}),"\n"]}),"\n",(0,t.jsx)(n.h5,{id:"2-on-richie",children:"2. On Richie"}),"\n",(0,t.jsxs)(n.p,{children:["To setup SSL conf with mkcert, just run:\n",(0,t.jsx)(n.code,{children:"bin/setup-ssl"})]}),"\n",(0,t.jsxs)(n.blockquote,{children:["\n",(0,t.jsxs)(n.p,{children:["If you do not want to use mkcert, read instructions above to generate Richie certificate then\nrun ",(0,t.jsx)(n.code,{children:"bin/setup-ssl --no-cert"})," instead."]}),"\n"]}),"\n",(0,t.jsx)(n.h5,{id:"3-on-openedx",children:"3. On OpenEdx"}),"\n",(0,t.jsxs)(n.p,{children:["In the same way, about OpenEdx, you also have to update the Nginx configuration to enable SSL.\nRead how to ",(0,t.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker#ssl",children:"enable SSL on OpenEdx"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:["Once this has been done, the OpenEdx app should respond on ",(0,t.jsx)(n.a,{href:"https://edx.local.dev:8073",children:"https://edx.local.dev:8073"}),"\nand Richie should respond on ",(0,t.jsx)(n.a,{href:"https://richie.local.dev:8070",children:"https://richie.local.dev:8070"})," and should be able\nto share cookies with OpenEdx to allow CORS CSRF Protected XHR requests."]}),"\n",(0,t.jsx)(n.h5,{id:"4-start-richie-and-openedx-over-ssl",children:"4. Start Richie and OpenEdx over SSL"}),"\n",(0,t.jsxs)(n.p,{children:["Now, OpenEdx app should respond on ",(0,t.jsx)(n.a,{href:"https://edx.local.dev:8073",children:"https://edx.local.dev:8073"}),", and Richie\non ",(0,t.jsx)(n.a,{href:"https://richie.local.dev:8070",children:"https://richie.local.dev:8070"})," without browser warning about the certificate validity."]}),"\n",(0,t.jsxs)(n.p,{children:["You need to follow these steps once. If you want to use SSL later, just use ",(0,t.jsx)(n.code,{children:"make run-ssl"})," to run\nOpenEdx and Richie apps.\nOf course, you can still run apps without ssl by using ",(0,t.jsx)(n.code,{children:"make run"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}},11151:(e,n,o)=>{o.d(n,{Z:()=>r,a:()=>c});var t=o(67294);const i={},s=t.createContext(i);function c(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:c(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);