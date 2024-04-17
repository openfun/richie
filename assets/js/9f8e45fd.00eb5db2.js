"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[76533],{35874:(n,e,s)=>{s.r(e),s.d(e,{assets:()=>a,contentTitle:()=>t,default:()=>u,frontMatter:()=>o,metadata:()=>c,toc:()=>l});var r=s(85893),i=s(11151);const o={id:"course-run-synchronization-api",title:"Course run synchronization API",sidebar_label:"course run sync"},t=void 0,c={id:"api/course-run-synchronization-api",title:"Course run synchronization API",description:"API endpoint allowing remote systems to synchronize their course runs with a Richie instance.",source:"@site/versioned_docs/version-2.11.0/api/course-run-synchronization-api.md",sourceDirName:"api",slug:"/api/course-run-synchronization-api",permalink:"/docs/2.11.0/api/course-run-synchronization-api",draft:!1,unlisted:!1,tags:[],version:"2.11.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1699548651e3,frontMatter:{id:"course-run-synchronization-api",title:"Course run synchronization API",sidebar_label:"course run sync"}},a={},l=[{value:"Synchronization endpoint [/api/1.0/course-runs-sync]",id:"synchronization-endpoint-api10course-runs-sync",level:2},{value:"Synchronize a course run [POST]",id:"synchronize-a-course-run-post",level:3}];function d(n){const e={code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...n.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(e.p,{children:"API endpoint allowing remote systems to synchronize their course runs with a Richie instance."}),"\n",(0,r.jsx)(e.h2,{id:"synchronization-endpoint-api10course-runs-sync",children:"Synchronization endpoint [/api/1.0/course-runs-sync]"}),"\n",(0,r.jsx)(e.p,{children:'This documentation describes version "1.0" of this API endpoint.'}),"\n",(0,r.jsx)(e.h3,{id:"synchronize-a-course-run-post",children:"Synchronize a course run [POST]"}),"\n",(0,r.jsx)(e.p,{children:"It takes a JSON object containing the course run details:"}),"\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:["resource_link: ",(0,r.jsx)(e.code,{children:"https://lms.example.com/courses/course-v1:001+001+001/info"})," (string, required) -\nurl of the course syllabus on the LMS from which a unique course identifier can be extracted"]}),"\n",(0,r.jsxs)(e.li,{children:["start: ",(0,r.jsx)(e.code,{children:"2018-02-01T06:00:00Z"})," (string, optional) - ISO 8601 date, when this session of the\ncourse starts"]}),"\n",(0,r.jsxs)(e.li,{children:["end: ",(0,r.jsx)(e.code,{children:"2018-02-28T06:00:00Z"})," (string, optional) - ISO 8601 date, when this session of the course\nends"]}),"\n",(0,r.jsxs)(e.li,{children:["enrollment_start: ",(0,r.jsx)(e.code,{children:"2018-01-01T06:00:00Z"})," (string, optional) - ISO 8601 date, when enrollment\nfor this session of the course starts"]}),"\n",(0,r.jsxs)(e.li,{children:["enrollment_end: ",(0,r.jsx)(e.code,{children:"2018-01-31T06:00:00Z"})," (string, optional) - ISO 8601 date, when enrollment for\nthis session of the course ends"]}),"\n",(0,r.jsx)(e.li,{children:"languages: ['fr', 'en'] (array[string], required) - ISO 639-1 code (2 letters) for the course's\nlanguages"}),"\n"]}),"\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:["\n",(0,r.jsx)(e.p,{children:"Request (application/json)"}),"\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:["Headers","\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:["Authorization: ",(0,r.jsx)(e.code,{children:"SIG-HMAC-SHA256 xxxxxxx"})," (string, required) - Authorization header\ncontaining the digest of the utf-8 encoded json representation of the submitted data\nfor the given secret key and SHA256 digest algorithm (see [synchronizing-course-runs]\nfor an example)."]}),"\n"]}),"\n"]}),"\n",(0,r.jsxs)(e.li,{children:["Body","\n",(0,r.jsx)(e.pre,{children:(0,r.jsx)(e.code,{className:"language-json",children:'{\n    "resource_link": "https://lms.example.com/courses/course-v1:001+001+001/info",\n    "start": "2021-02-01T00:00:00Z",\n    "end": "2021-02-31T23:59:59Z",\n    "enrollment_start": "2021-01-01T00:00:00Z",\n    "enrollment_end": "2021-01-31T23:59:59Z",\n    "languages": ["en", "fr"]\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsxs)(e.li,{children:["\n",(0,r.jsx)(e.p,{children:"Response 200 (application/json)"}),"\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:["Body","\n",(0,r.jsx)(e.pre,{children:(0,r.jsx)(e.code,{className:"language-json",children:'{\n    "success": True\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]})]})}function u(n={}){const{wrapper:e}={...(0,i.a)(),...n.components};return e?(0,r.jsx)(e,{...n,children:(0,r.jsx)(d,{...n})}):d(n)}},11151:(n,e,s)=>{s.d(e,{Z:()=>c,a:()=>t});var r=s(67294);const i={},o=r.createContext(i);function t(n){const e=r.useContext(o);return r.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function c(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(i):n.components||i:t(n.components),r.createElement(o.Provider,{value:e},n.children)}}}]);