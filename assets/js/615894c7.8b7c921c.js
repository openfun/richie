"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[67574],{68677:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>s,metadata:()=>r,toc:()=>d});var t=i(74848),o=i(28453);const s={id:"joanie-connection",title:"Joanie Connection",sidebar_label:"Joanie Connection"},c="Joanie Connection",r={id:"joanie-connection",title:"Joanie Connection",description:"Settings",source:"@site/versioned_docs/version-2.15.1/joanie-connection.md",sourceDirName:".",slug:"/joanie-connection",permalink:"/docs/2.15.1/joanie-connection",draft:!1,unlisted:!1,tags:[],version:"2.15.1",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1660143231e3,frontMatter:{id:"joanie-connection",title:"Joanie Connection",sidebar_label:"Joanie Connection"}},a={},d=[{value:"Settings",id:"settings",level:2},{value:"Access Token",id:"access-token",level:2},{value:"Lifetime configuration",id:"lifetime-configuration",level:3}];function l(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"joanie-connection",children:"Joanie Connection"})}),"\n",(0,t.jsx)(n.h2,{id:"settings",children:"Settings"}),"\n",(0,t.jsxs)(n.p,{children:["All settings related to Joanie have to be declared in the ",(0,t.jsx)(n.code,{children:"JOANIE"})," dictionary\nwithin ",(0,t.jsx)(n.code,{children:"settings.py"}),".\nTo enable Joanie, the minimal configuration requires one property:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"BASE_URL"})," : the endpoint at which Joanie is accessible"]}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["Add to your ",(0,t.jsx)(n.code,{children:"settings.py"}),":"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'...\nJOANIE = {\n  "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None)\n}\n...\n'})}),"\n",(0,t.jsx)(n.h2,{id:"access-token",children:"Access Token"}),"\n",(0,t.jsx)(n.h3,{id:"lifetime-configuration",children:"Lifetime configuration"}),"\n",(0,t.jsxs)(n.p,{children:["Access Token is stored within the SessionStorage through\n",(0,t.jsx)(n.a,{href:"https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/utils/react-query/createSessionStoragePersistor/index.ts",children:"react-query client persistor"}),".\nBy default, richie frontend considered access token as stale after 5 minutes. You can change this\nvalue into ",(0,t.jsx)(n.a,{href:"https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/settings.ts",children:(0,t.jsx)(n.code,{children:"settings.ts"})}),"\nby editing ",(0,t.jsx)(n.code,{children:"REACT_QUERY_SETTINGS.staleTimes.session"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:["To always have a valid access token, you have to configure properly its stale time according to the\nlifetime of the access token defined by your authentication server. For example, if your\nauthentication server is using ",(0,t.jsx)(n.code,{children:"djangorestframework-simplejwt"})," to generate the access token,\nits lifetime is 5 minutes by default."]})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}},28453:(e,n,i)=>{i.d(n,{R:()=>c,x:()=>r});var t=i(96540);const o={},s=t.createContext(o);function c(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:c(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);