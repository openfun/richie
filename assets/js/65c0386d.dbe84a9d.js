"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[22859],{63389:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>t,metadata:()=>c,toc:()=>d});var s=i(85893),o=i(11151);const t={id:"joanie-connection",title:"Joanie Connection",sidebar_label:"Joanie Connection"},r=void 0,c={id:"joanie-connection",title:"Joanie Connection",description:"Joanie delivers an API able to manage course",source:"@site/versioned_docs/version-2.22.0/joanie-connection.md",sourceDirName:".",slug:"/joanie-connection",permalink:"/docs/2.22.0/joanie-connection",draft:!1,unlisted:!1,tags:[],version:"2.22.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1682069684,formattedLastUpdatedAt:"Apr 21, 2023",frontMatter:{id:"joanie-connection",title:"Joanie Connection",sidebar_label:"Joanie Connection"}},a={},d=[{value:"Configuring Joanie",id:"configuring-joanie",level:2},{value:"BASE_URL",id:"base_url",level:3},{value:"BACKEND",id:"backend",level:3},{value:"JS_BACKEND",id:"js_backend",level:3},{value:"COURSE_REGEX",id:"course_regex",level:3},{value:"JS_COURSE_REGEX",id:"js_course_regex",level:3},{value:"COURSE_RUN_SYNC_NO_UPDATE_FIELDS",id:"course_run_sync_no_update_fields",level:3},{value:"DEFAULT_COURSE_RUN_SYNC_MODE",id:"default_course_run_sync_mode",level:3},{value:"Access Token",id:"access-token",level:2},{value:"Lifetime configuration",id:"lifetime-configuration",level:3},{value:"Technical support",id:"technical-support",level:2}];function l(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.a,{href:"https://github.com/openfun/joanie",children:"Joanie"})," delivers an API able to manage course\nenrollment/subscription, payment and certificates delivery. Richie can be configured to display\ncourse runs and micro-credentials managed through Joanie."]}),"\n",(0,s.jsxs)(n.p,{children:["In fact, Richie treats Joanie almost like a ",(0,s.jsx)(n.a,{href:"/docs/2.22.0/lms-backends",children:"LMS backend"})," that's why settings\nare similars."]}),"\n",(0,s.jsx)(n.h2,{id:"configuring-joanie",children:"Configuring Joanie"}),"\n",(0,s.jsxs)(n.p,{children:["All settings related to Joanie have to be declared in the ",(0,s.jsx)(n.code,{children:"JOANIE_BACKEND"})," dictionnary\nwithin ",(0,s.jsx)(n.code,{children:"settings.py"}),"."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'JOANIE_BACKEND = {\n    "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None),\n    "BACKEND": values.Value("richie.apps.courses.lms.joanie.JoanieBackend", environ_name="JOANIE_BACKEND", environ_prefix=None),\n    "JS_BACKEND": values.Value("joanie", environ_name="JOANIE_JS_BACKEND", environ_prefix=None),\n    "COURSE_REGEX": values.Value(\n        r"^.*/api/v1.0/(?P<resource_type>(course-runs|products))/(?P<resource_id>[^/]*)/?$",\n        environ_name="JOANIE_COURSE_REGEX",\n        environ_prefix=None,\n    ),\n    "JS_COURSE_REGEX": values.Value(\n        r"^.*/api/v1.0/(course-runs|products)/([^/]*)/?$",\n        environ_name="JOANIE_JS_COURSE_REGEX",\n        environ_prefix=None,\n    ),\n    # Course runs synchronization\n    "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],\n    "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",\n}\n...\n'})}),"\n",(0,s.jsxs)(n.p,{children:["As mentioned earlier, Joanie is treated as a LMS by Richie, so we have to bind Joanie settings with\nLMS backends settings. We achieve this by dynamically appending the ",(0,s.jsx)(n.code,{children:"JOANIE_BACKEND"})," setting value\ninto the ",(0,s.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," list, if Joanie is enabled. To understand this point, you can take a\nlook at the ",(0,s.jsx)(n.code,{children:"post_setup"})," method of the Base class configuration into ",(0,s.jsx)(n.code,{children:"settings.py"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["Here they are all settings available into ",(0,s.jsx)(n.code,{children:"JOANIE_BACKEND"}),":"]}),"\n",(0,s.jsx)(n.h3,{id:"base_url",children:"BASE_URL"}),"\n",(0,s.jsxs)(n.p,{children:["The base url on which the Joanie instance is hosted. This is used to construct the complete url of\nthe API endpoint on which requests are made by Richie's frontend application. ",(0,s.jsx)(n.em,{children:"Richie checks if this\nsettings is set to know if Joanie should be enabled or not."})]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,s.jsxs)(n.li,{children:["Value: for example ",(0,s.jsx)(n.a,{href:"https://joanie.example.com",children:"https://joanie.example.com"})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"backend",children:"BACKEND"}),"\n",(0,s.jsx)(n.p,{children:"The path to a Python class serving as Joanie backend. You should not need to change this setting\nuntil you want to customize the behavior of the python Joanie backend."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: No"}),"\n",(0,s.jsxs)(n.li,{children:["Value: By default it is ",(0,s.jsx)(n.code,{children:"richie.apps.courses.lms.joanie.JoanieBackend"})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"js_backend",children:"JS_BACKEND"}),"\n",(0,s.jsx)(n.p,{children:"The name of the ReactJS backend to use Joanie. You should not need to change this setting\nuntil you want to customize the behavior of the js Joanie backend."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: No"}),"\n",(0,s.jsxs)(n.li,{children:["Value: By default it is ",(0,s.jsx)(n.code,{children:"joanie"}),"."]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"course_regex",children:"COURSE_REGEX"}),"\n",(0,s.jsxs)(n.p,{children:["A python regex that should match the ressource api urls of Joanie and return a\n",(0,s.jsx)(n.code,{children:"resource_type"}),' named group ("course_runs" or "products") and also a ',(0,s.jsx)(n.code,{children:"resource_id"}),"\nnamed group corresponding to the resource uuid."]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: No"}),"\n",(0,s.jsxs)(n.li,{children:["Value: for example ",(0,s.jsx)(n.code,{children:'r"^.*/api/v1.0/(?P<resource_type>(course-runs|products))/(?P<resource_id>[^/]*)/?$"'})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"js_course_regex",children:"JS_COURSE_REGEX"}),"\n",(0,s.jsx)(n.p,{children:'A Javascript regex that should match the ressource api urls of Joanie and return two\nunnamed groups. The first one corresponds to the resource type ("course_runs" or "products") and\nthe second one corresponds to the resource uuid.'}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: No"}),"\n",(0,s.jsxs)(n.li,{children:["Value: for example ",(0,s.jsx)(n.code,{children:'r"^.*/api/v1.0/(course-runs|products)/([^/]*)/?$"'})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"course_run_sync_no_update_fields",children:"COURSE_RUN_SYNC_NO_UPDATE_FIELDS"}),"\n",(0,s.jsx)(n.p,{children:"A list of fields that must only be set the first time a course run is synchronized. During this\nfirst synchronization, a new course run is created in Richie and all fields sent to the API\nendpoint via the payload are set on the object. For subsequent synchronization calls, the fields\nlisted in this setting are ignored and not synchronized. This can be used to allow modifying some\nfields manually in Richie regardless of what OpenEdX sends after an initial value is set."}),"\n",(0,s.jsxs)(n.p,{children:["Read documentation of ",(0,s.jsxs)(n.a,{href:"/docs/2.22.0/lms-backends#course_run_sync_no_update_fields",children:["the eponym ",(0,s.jsx)(n.code,{children:"LMS_BACKENDS"})," settings"]}),",\nto discover how it can be configured."]}),"\n",(0,s.jsx)(n.h3,{id:"default_course_run_sync_mode",children:"DEFAULT_COURSE_RUN_SYNC_MODE"}),"\n",(0,s.jsxs)(n.p,{children:["Joanie resources (course runs and products) are all synchronized with Richie as a CourseRun. This\nsetting is used to set the value of the ",(0,s.jsx)(n.code,{children:"sync_mode"})," field when a course run is created on Richie.\nRead documentation of ",(0,s.jsxs)(n.a,{href:"/docs/2.22.0/lms-backends#default_course_run_sync_mode",children:["the eponym ",(0,s.jsx)(n.code,{children:"LMS_BACKENDS"})," settings"]}),",\nto discover how it can be configured."]}),"\n",(0,s.jsx)(n.h2,{id:"access-token",children:"Access Token"}),"\n",(0,s.jsx)(n.h3,{id:"lifetime-configuration",children:"Lifetime configuration"}),"\n",(0,s.jsxs)(n.p,{children:["Access Token is stored within the SessionStorage through ",(0,s.jsx)(n.a,{href:"https://tanstack.com/query/v4/docs/plugins/persistQueryClient",children:"react-query client persister"}),".\nBy default, richie frontend considered access token as stale after 5 minutes. You can change this\nvalue into ",(0,s.jsx)(n.a,{href:"https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/settings.ts",children:(0,s.jsx)(n.code,{children:"settings.ts"})}),"\nby editing ",(0,s.jsx)(n.code,{children:"REACT_QUERY_SETTINGS.staleTimes.session"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["To always have a valid access token, you have to configure properly its stale time according to the\nlifetime of the access token defined by your authentication server. For example, if your\nauthentication server is using ",(0,s.jsx)(n.code,{children:"djangorestframework-simplejwt"})," to generate the access token,\nits lifetime is 5 minutes by default."]}),"\n",(0,s.jsx)(n.h2,{id:"technical-support",children:"Technical support"}),"\n",(0,s.jsxs)(n.p,{children:["If you encounter an issue with this documentation, please\n",(0,s.jsx)(n.a,{href:"https://github.com/openfun/richie/issues",children:"open an issue on our repository"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,o.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},11151:(e,n,i)=>{i.d(n,{Z:()=>c,a:()=>r});var s=i(67294);const o={},t=s.createContext(o);function r(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);