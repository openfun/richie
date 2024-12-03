"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[96054],{46661:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>c,metadata:()=>i,toc:()=>l});const i=JSON.parse('{"id":"lms-connection","title":"Connecting Richie with one or more LMS","description":"Connecting Richie to an LMS","source":"@site/versioned_docs/version-2.30.0/lms-connection.md","sourceDirName":".","slug":"/lms-connection","permalink":"/docs/2.30.0/lms-connection","draft":false,"unlisted":false,"tags":[],"version":"2.30.0","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1729083340000,"frontMatter":{"id":"lms-connection","title":"Connecting Richie with one or more LMS","sidebar_label":"LMS connection"},"sidebar":"docs","previous":{"title":"I18n","permalink":"/docs/2.30.0/internationalization"},"next":{"title":"Web Analytics","permalink":"/docs/2.30.0/web-analytics"}}');var t=o(74848),s=o(28453);const c={id:"lms-connection",title:"Connecting Richie with one or more LMS",sidebar_label:"LMS connection"},r=void 0,a={},l=[{value:"Connecting Richie to an LMS",id:"connecting-richie-to-an-lms",level:2},{value:"1. Displaying connection status",id:"1-displaying-connection-status",level:3},{value:"2. Seamless enrollment",id:"2-seamless-enrollment",level:3},{value:"3. Synchronizing course runs details",id:"3-synchronizing-course-runs-details",level:3},{value:"4. Joanie, the enrollment manager",id:"4-joanie-the-enrollment-manager",level:3},{value:"Development",id:"development",level:2}];function d(e){const n={a:"a",blockquote:"blockquote",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:"connecting-richie-to-an-lms",children:"Connecting Richie to an LMS"}),"\n",(0,t.jsx)(n.p,{children:"Richie can be connected to an LMS in several ways, ranging from SSO to a fully integrated\nseamless experience."}),"\n",(0,t.jsx)(n.p,{children:"As of today, each approach has been implemented for OpenEdX but the same could be done for\nother LMSes like Moodle, at the cost of minor adaptations."}),"\n",(0,t.jsx)(n.h3,{id:"1-displaying-connection-status",children:"1. Displaying connection status"}),"\n",(0,t.jsx)(n.p,{children:"OpenEdX can be configured to allow CORS requests. Doing so allows Richie to retrieve a user's\nconnection status from OpenEdx and display the user's profile information directly on the Richie\nsite: username, dashboard url, etc."}),"\n",(0,t.jsx)(n.p,{children:"In this approach, a user visiting your Richie site and trying to signup or login, is sent to the\nOpenEdX site for authentication and is redirected back to the Richie site upon successful login."}),"\n",(0,t.jsxs)(n.p,{children:["You can see this in action on ",(0,t.jsx)(n.a,{href:"https://www.fun-mooc.fr",children:"https://www.fun-mooc.fr"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:["We provide detailed instructions on\n",(0,t.jsx)(n.a,{href:"/docs/2.30.0/displaying-connection-status",children:"how to configure displaying OpenEdX connection status in Richie"}),"."]}),"\n",(0,t.jsx)(n.h3,{id:"2-seamless-enrollment",children:"2. Seamless enrollment"}),"\n",(0,t.jsx)(n.p,{children:"Thanks to OpenEdX's enrollment API, it is possible to let users enroll on course runs without\nleaving Richie."}),"\n",(0,t.jsxs)(n.p,{children:["You can see this in action on ",(0,t.jsx)(n.a,{href:"https://www.fun-mooc.fr",children:"https://www.fun-mooc.fr"}),"."]}),"\n",(0,t.jsxs)(n.blockquote,{children:["\n",(0,t.jsxs)(n.p,{children:["This feature requires that Richie and OpenEdX be hosted on sibling domains i.e. domains that\nare both subdomains of the same root domain, e.g. ",(0,t.jsx)(n.code,{children:"richie.example.com"})," and ",(0,t.jsx)(n.code,{children:"lms.example.com"}),"."]}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["You should read our guide on ",(0,t.jsx)(n.a,{href:"lms-backends",children:"how to use OpenEdX as LMS backend for Richie"}),"."]}),"\n",(0,t.jsx)(n.h3,{id:"3-synchronizing-course-runs-details",children:"3. Synchronizing course runs details"}),"\n",(0,t.jsx)(n.p,{children:"Course runs in Richie can be handled manually, filling all fields via the DjangoCMS front-end\nediting interface. But a better way to handle course runs is to synchronize them automatically\nfrom your LMS using the course run synchronization API."}),"\n",(0,t.jsxs)(n.p,{children:["Please refer to our guide on ",(0,t.jsx)(n.a,{href:"synchronizing-course-runs",children:"how to synchronize course runs between Richie and OpenEdx"})]}),"\n",(0,t.jsx)(n.h3,{id:"4-joanie-the-enrollment-manager",children:"4. Joanie, the enrollment manager"}),"\n",(0,t.jsxs)(n.p,{children:["For more advanced use cases, we have started a new project called ",(0,t.jsx)(n.a,{href:"https://github.com/openfun/joanie",children:"Joanie"})," which acts as an\nenrollment manager for Richie."]}),"\n",(0,t.jsx)(n.p,{children:"Authentication in Joanie is done via JWT Tokens for maximum flexibility and decoupling in\nidentity management."}),"\n",(0,t.jsx)(n.p,{children:"The project started early 2021, but over time, Joanie will handle:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"paid enrollments / certification"}),"\n",(0,t.jsx)(n.li,{children:"micro-credentials"}),"\n",(0,t.jsx)(n.li,{children:"user dashboard"}),"\n",(0,t.jsx)(n.li,{children:"cohorts management (academic or B2B)"}),"\n",(0,t.jsx)(n.li,{children:"multi-LMS catalogs"}),"\n",(0,t.jsx)(n.li,{children:"time based enrollment"}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"development",children:"Development"}),"\n",(0,t.jsxs)(n.p,{children:["For development purposes, the docker compose project provided on\n",(0,t.jsx)(n.a,{href:"https://github.com/openfun/richie",children:"Richie's code repository"})," is pre-configured to connect\nwith an OpenEdx instance started with\n",(0,t.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker",children:"OpenEdx Docker"}),", which provides a ready-to-use\ndocker compose stack of OpenEdx in several flavors. Head over to\n",(0,t.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker#readme",children:"OpenEdx Docker README"})," for instructions on how to bootstrap an OpenEdX instance."]}),"\n",(0,t.jsxs)(n.p,{children:["Now, start both the OpenEdX and Richie projects separately with ",(0,t.jsx)(n.code,{children:"make run"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:["Richie should respond on ",(0,t.jsx)(n.code,{children:"http://localhost:8070"}),", OpenEdx on ",(0,t.jsx)(n.code,{children:"http://localhost:8073"})," and both\napps should be able to communicate with each other via the network bridge defined in\ndocker compose."]}),"\n",(0,t.jsxs)(n.p,{children:["If you want to activate ",(0,t.jsx)(n.a,{href:"#2-seamless-enrollment",children:"seamless enrollment"})," locally for development,\nyou will need to set up TLS domains for both Richie and OpenEdX. To do this, head over to our\nguide on ",(0,t.jsx)(n.a,{href:"tls-connection",children:"setting-up TLS connections for Richie and OpenEdX"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},28453:(e,n,o)=>{o.d(n,{R:()=>c,x:()=>r});var i=o(96540);const t={},s=i.createContext(t);function c(e){const n=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:c(e.components),i.createElement(s.Provider,{value:n},e.children)}}}]);