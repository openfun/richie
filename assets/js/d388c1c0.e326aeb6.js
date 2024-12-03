"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[73209],{43773:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>l,contentTitle:()=>t,default:()=>h,frontMatter:()=>c,metadata:()=>i,toc:()=>d});const i=JSON.parse('{"id":"lms-backends","title":"Configuring LMS Backends","description":"Richie can be connected to one or more OpenEdX Learning Management Systems (LMS) for a seamless","source":"@site/versioned_docs/version-2.21.0/lms-backends.md","sourceDirName":".","slug":"/lms-backends","permalink":"/docs/2.21.0/lms-backends","draft":false,"unlisted":false,"tags":[],"version":"2.21.0","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1679473023000,"frontMatter":{"id":"lms-backends","title":"Configuring LMS Backends","sidebar_label":"LMS Backends"}}');var r=s(74848),o=s(28453);const c={id:"lms-backends",title:"Configuring LMS Backends",sidebar_label:"LMS Backends"},t=void 0,l={},d=[{value:"Prerequisites",id:"prerequisites",level:2},{value:"Configuring the LMS handler",id:"configuring-the-lms-handler",level:2},{value:"BASE_URL",id:"base_url",level:3},{value:"BACKEND",id:"backend",level:3},{value:"COURSE_REGEX",id:"course_regex",level:3},{value:"JS_BACKEND",id:"js_backend",level:3},{value:"JS_COURSE_REGEX",id:"js_course_regex",level:3},{value:"DEFAULT_COURSE_RUN_SYNC_MODE",id:"default_course_run_sync_mode",level:3},{value:"COURSE_RUN_SYNC_NO_UPDATE_FIELDS",id:"course_run_sync_no_update_fields",level:3},{value:"Technical support",id:"technical-support",level:2}];function a(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.p,{children:"Richie can be connected to one or more OpenEdX Learning Management Systems (LMS) for a seamless\nexperience between browsing the course catalog on Richie, enrolling to a course and following the\ncourse itself on the LMS."}),"\n",(0,r.jsx)(n.p,{children:"It is possible to do the same with Moodle or any other LMS exposing an enrollment API, at the\ncost of writing a custom LMS handler backend."}),"\n",(0,r.jsx)(n.h2,{id:"prerequisites",children:"Prerequisites"}),"\n",(0,r.jsxs)(n.p,{children:["This connection requires that Richie and OpenEdX be hosted on sibling domains i.e. domains that\nare both subdomains of the same root domain, e.g. ",(0,r.jsx)(n.code,{children:"richie.example.com"})," and ",(0,r.jsx)(n.code,{children:"lms.example.com"}),"."]}),"\n",(0,r.jsx)(n.p,{children:"OpenEdX will need to generate a CORS CSRF Cookie and this cookie is flagged as secure, which\nimplies that we are not able to use it without SSL connections."}),"\n",(0,r.jsx)(n.p,{children:"As a consequence, you need to configure your OpenEdX instance as follows:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'FEATURES = {\n    ...\n    "ENABLE_CORS_HEADERS": True,\n    "ENABLE_CROSS_DOMAIN_CSRF_COOKIE": True,\n}\n\nCORS_ALLOW_CREDENTIALS = True\nCORS_ALLOW_INSECURE = False\nCORS_ORIGIN_WHITELIST: ["richie.example.com"]  # The domain on which Richie is hosted\n\nCROSS_DOMAIN_CSRF_COOKIE_DOMAIN = ".example.com"  # The parent domain shared by Richie and OpenEdX\nCROSS_DOMAIN_CSRF_COOKIE_NAME: "edx_csrf_token"\nSESSION_COOKIE_NAME: "edx_session"\n'})}),"\n",(0,r.jsx)(n.h2,{id:"configuring-the-lms-handler",children:"Configuring the LMS handler"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"LMSHandler"})," utility acts as a proxy that routes queries to the correct LMS backend API,\nbased on a regex match on the URL of the course. It is configured via the ",(0,r.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"}),"\nsetting. As an example, here is how it would be configured to connect to an Ironwood OpenEdX\ninstance hosted on ",(0,r.jsx)(n.code,{children:"https://lms.example.com"}),":"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'RICHIE_LMS_BACKENDS=[\n    {\n        "BASE_URL": "https://lms.example.com",\n        # Django\n        "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",\n        "COURSE_REGEX": r"^https://lms\\.example\\.com/courses/(?P<course_id>.*)/course/?$",\n        # ReactJS\n        "JS_BACKEND": "openedx-hawthorn",\n        "JS_COURSE_REGEX": r"^https://lms\\.example\\.com/courses/(.*)/course/?$",\n        # Course runs synchronization\n        "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],\n        "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",\n    },\n]\n'})}),"\n",(0,r.jsx)(n.p,{children:"The following should help you understand how to configure this setting:"}),"\n",(0,r.jsx)(n.h3,{id:"base_url",children:"BASE_URL"}),"\n",(0,r.jsx)(n.p,{children:"The base url on which the OpenEdX instance is hosted. This is used to construct the complete url\nof the API endpoint on which the enrollment request is made by Richie's frontend application."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: string"}),"\n",(0,r.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,r.jsxs)(n.li,{children:["Value: for example ",(0,r.jsx)(n.a,{href:"https://lms.example.com",children:"https://lms.example.com"})]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"backend",children:"BACKEND"}),"\n",(0,r.jsx)(n.p,{children:"The path to a Python class serving as LMS backend for the targeted LMS."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: string"}),"\n",(0,r.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,r.jsxs)(n.li,{children:["Value: Richie ships with the following Python backends (custom backends can be written to fit\nanother specific LMS):","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"richie.apps.courses.lms.edx.EdXLMSBackend"}),": backend for OpenEdX"]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"richie.apps.courses.lms.base.BaseLMSBackend"}),": fake backend for development purposes"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"course_regex",children:"COURSE_REGEX"}),"\n",(0,r.jsxs)(n.p,{children:["A Python regex that should match the course syllabus urls of the targeted LMS and return a\n",(0,r.jsx)(n.code,{children:"course_id"})," named group on the id of the course extracted from these urls."]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: string"}),"\n",(0,r.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,r.jsxs)(n.li,{children:["Value: for example ",(0,r.jsx)(n.code,{children:"^.*/courses/(?P<course_id>.*)/course/?$"})]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"js_backend",children:"JS_BACKEND"}),"\n",(0,r.jsx)(n.p,{children:"The name of the ReactJS backend to use for the targeted LMS."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: string"}),"\n",(0,r.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,r.jsxs)(n.li,{children:["Value: Richie ships with the following Javascript backends (custom backends can be written to\nfit another specific LMS):","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"openedx-dogwood"}),": backend for OpenEdX versions equal to ",(0,r.jsx)(n.code,{children:"dogwood"})," or ",(0,r.jsx)(n.code,{children:"eucalyptus"})]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"openedx-hawthorn"}),": backend for OpenEdX versions equal to ",(0,r.jsx)(n.code,{children:"hawthorn"})," or higher"]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"openedx-fonzie"}),": backend for OpenEdX via ",(0,r.jsx)(n.a,{href:"https://github.com/openfun/fonzie",children:"Fonzie"}),"\n(extra user info and JWT tokens)"]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"dummy"}),": fake backend for development purposes"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"js_course_regex",children:"JS_COURSE_REGEX"}),"\n",(0,r.jsx)(n.p,{children:"A Javascript regex that should match the course syllabus urls of the targeted LMS and return an\nunnamed group on the id of the course extracted from these urls."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: string"}),"\n",(0,r.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,r.jsxs)(n.li,{children:["Value: for example ",(0,r.jsx)(n.code,{children:"^.*/courses/(.*)/course/?$"})]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"default_course_run_sync_mode",children:"DEFAULT_COURSE_RUN_SYNC_MODE"}),"\n",(0,r.jsxs)(n.p,{children:["When a course run is created, this setting is used to set the value of the ",(0,r.jsx)(n.code,{children:"sync_mode"})," field.\nThis value defines how the course runs synchronization script will impact this course run after\ncreation."]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: enum(string)"}),"\n",(0,r.jsx)(n.li,{children:"Required: No"}),"\n",(0,r.jsxs)(n.li,{children:["Value: possible values are ",(0,r.jsx)(n.code,{children:"manual"}),", ",(0,r.jsx)(n.code,{children:"sync_to_draft"})," and ",(0,r.jsx)(n.code,{children:"sync_to_public"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"manual"}),": this course run is ignored by the course runs synchronization script"]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"sync_to_draft"}),": only the draft version of this course run is synchronized. A manual\npublication is necessary for the update to be visible on the public site."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"sync_to_public"}),": the public version of this course run is updated by the synchronization\nscript. As a results, updates are directly visible on the public site without further\npublication by a staff user in Richie."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"course_run_sync_no_update_fields",children:"COURSE_RUN_SYNC_NO_UPDATE_FIELDS"}),"\n",(0,r.jsx)(n.p,{children:"A list of fields that must only be set the first time a course run is synchronized. During this\nfirst synchronization, a new course run is created in Richie and all fields sent to the API\nendpoint via the payload are set on the object. For subsequent synchronization calls, the fields\nlisted in this setting are ignored and not synchronized. This can be used to allow modifying some\nfields manually in Richie regardless of what OpenEdX sends after an initial value is set."}),"\n",(0,r.jsxs)(n.p,{children:["Note that this setting is only effective for course runs with the ",(0,r.jsx)(n.code,{children:"sync_mode"})," field set to a\nvalue other then ",(0,r.jsx)(n.code,{children:"manual"}),"."]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Type: enum(string)"}),"\n",(0,r.jsx)(n.li,{children:"Required: No"}),"\n",(0,r.jsx)(n.li,{children:'Value: for example ["languages"]'}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"technical-support",children:"Technical support"}),"\n",(0,r.jsxs)(n.p,{children:["If you encounter an issue with this documentation or the backends included in Richie, please\n",(0,r.jsx)(n.a,{href:"https://github.com/openfun/richie/issues",children:"open an issue on our repository"}),"."]}),"\n",(0,r.jsxs)(n.p,{children:["If you need a custom backend, you can ",(0,r.jsx)(n.a,{href:"https://github.com/openfun/richie/pulls",children:"submit a PR"})," or\n",(0,r.jsx)(n.a,{href:"https://github.com/openfun/richie/issues",children:"open an issue"})," and we will consider adding it."]})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(a,{...e})}):a(e)}},28453:(e,n,s)=>{s.d(n,{R:()=>c,x:()=>t});var i=s(96540);const r={},o=i.createContext(r);function c(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);