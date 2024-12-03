"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[14505],{83889:(n,e,s)=>{s.r(e),s.d(e,{assets:()=>a,contentTitle:()=>c,default:()=>u,frontMatter:()=>t,metadata:()=>r,toc:()=>l});const r=JSON.parse('{"id":"api/course-run-synchronization-api","title":"Course run synchronization API","description":"API endpoint allowing remote systems to synchronize their course runs with a Richie instance.","source":"@site/versioned_docs/version-2.18.0/api/course-run-synchronization-api.md","sourceDirName":"api","slug":"/api/course-run-synchronization-api","permalink":"/docs/2.18.0/api/course-run-synchronization-api","draft":false,"unlisted":false,"tags":[],"version":"2.18.0","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1699548651000,"frontMatter":{"id":"course-run-synchronization-api","title":"Course run synchronization API","sidebar_label":"course run sync"}}');var i=s(74848),o=s(28453);const t={id:"course-run-synchronization-api",title:"Course run synchronization API",sidebar_label:"course run sync"},c=void 0,a={},l=[{value:"Synchronization endpoint [/api/1.0/course-runs-sync]",id:"synchronization-endpoint-api10course-runs-sync",level:2},{value:"Synchronize a course run [POST]",id:"synchronize-a-course-run-post",level:3}];function d(n){const e={code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...n.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(e.p,{children:"API endpoint allowing remote systems to synchronize their course runs with a Richie instance."}),"\n",(0,i.jsx)(e.h2,{id:"synchronization-endpoint-api10course-runs-sync",children:"Synchronization endpoint [/api/1.0/course-runs-sync]"}),"\n",(0,i.jsx)(e.p,{children:'This documentation describes version "1.0" of this API endpoint.'}),"\n",(0,i.jsx)(e.h3,{id:"synchronize-a-course-run-post",children:"Synchronize a course run [POST]"}),"\n",(0,i.jsx)(e.p,{children:"It takes a JSON object containing the course run details:"}),"\n",(0,i.jsxs)(e.ul,{children:["\n",(0,i.jsxs)(e.li,{children:["resource_link: ",(0,i.jsx)(e.code,{children:"https://lms.example.com/courses/course-v1:001+001+001/info"})," (string, required) -\nurl of the course syllabus on the LMS from which a unique course identifier can be extracted"]}),"\n",(0,i.jsxs)(e.li,{children:["start: ",(0,i.jsx)(e.code,{children:"2018-02-01T06:00:00Z"})," (string, optional) - ISO 8601 date, when this session of the\ncourse starts"]}),"\n",(0,i.jsxs)(e.li,{children:["end: ",(0,i.jsx)(e.code,{children:"2018-02-28T06:00:00Z"})," (string, optional) - ISO 8601 date, when this session of the course\nends"]}),"\n",(0,i.jsxs)(e.li,{children:["enrollment_start: ",(0,i.jsx)(e.code,{children:"2018-01-01T06:00:00Z"})," (string, optional) - ISO 8601 date, when enrollment\nfor this session of the course starts"]}),"\n",(0,i.jsxs)(e.li,{children:["enrollment_end: ",(0,i.jsx)(e.code,{children:"2018-01-31T06:00:00Z"})," (string, optional) - ISO 8601 date, when enrollment for\nthis session of the course ends"]}),"\n",(0,i.jsx)(e.li,{children:"languages: ['fr', 'en'] (array[string], required) - ISO 639-1 code (2 letters) for the course's\nlanguages"}),"\n"]}),"\n",(0,i.jsxs)(e.ul,{children:["\n",(0,i.jsxs)(e.li,{children:["\n",(0,i.jsx)(e.p,{children:"Request (application/json)"}),"\n",(0,i.jsxs)(e.ul,{children:["\n",(0,i.jsxs)(e.li,{children:["Headers","\n",(0,i.jsxs)(e.ul,{children:["\n",(0,i.jsxs)(e.li,{children:["Authorization: ",(0,i.jsx)(e.code,{children:"SIG-HMAC-SHA256 xxxxxxx"})," (string, required) - Authorization header\ncontaining the digest of the utf-8 encoded json representation of the submitted data\nfor the given secret key and SHA256 digest algorithm (see [synchronizing-course-runs]\nfor an example)."]}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(e.li,{children:["Body","\n",(0,i.jsx)(e.pre,{children:(0,i.jsx)(e.code,{className:"language-json",children:'{\n    "resource_link": "https://lms.example.com/courses/course-v1:001+001+001/info",\n    "start": "2021-02-01T00:00:00Z",\n    "end": "2021-02-31T23:59:59Z",\n    "enrollment_start": "2021-01-01T00:00:00Z",\n    "enrollment_end": "2021-01-31T23:59:59Z",\n    "languages": ["en", "fr"]\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(e.li,{children:["\n",(0,i.jsx)(e.p,{children:"Response 200 (application/json)"}),"\n",(0,i.jsxs)(e.ul,{children:["\n",(0,i.jsxs)(e.li,{children:["Body","\n",(0,i.jsx)(e.pre,{children:(0,i.jsx)(e.code,{className:"language-json",children:'{\n    "success": True\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]})]})}function u(n={}){const{wrapper:e}={...(0,o.R)(),...n.components};return e?(0,i.jsx)(e,{...n,children:(0,i.jsx)(d,{...n})}):d(n)}},28453:(n,e,s)=>{s.d(e,{R:()=>t,x:()=>c});var r=s(96540);const i={},o=r.createContext(i);function t(n){const e=r.useContext(o);return r.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function c(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(i):n.components||i:t(n.components),r.createElement(o.Provider,{value:e},n.children)}}}]);