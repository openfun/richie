"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[24187],{3268:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>o,metadata:()=>l,toc:()=>c});var s=i(74848),t=i(28453);const o={id:"displaying-connection-status",title:"Displaying OpenEdX connection status in Richie",sidebar_label:"Displaying connection status"},r=void 0,l={id:"displaying-connection-status",title:"Displaying OpenEdX connection status in Richie",description:"This guide explains how to configure Richie and OpenEdX to share the OpenEdX connection status",source:"@site/versioned_docs/version-2.29.0/displaying-connection-status.md",sourceDirName:".",slug:"/displaying-connection-status",permalink:"/docs/2.29.0/displaying-connection-status",draft:!1,unlisted:!1,tags:[],version:"2.29.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1724260338e3,frontMatter:{id:"displaying-connection-status",title:"Displaying OpenEdX connection status in Richie",sidebar_label:"Displaying connection status"}},a={},c=[{value:"Prerequisites",id:"prerequisites",level:2},{value:"Allow redirects",id:"allow-redirects",level:2},{value:"Configure authentication delegation",id:"configure-authentication-delegation",level:2},{value:"BASE_URL",id:"base_url",level:3},{value:"BACKEND",id:"backend",level:3},{value:"PROFILE_URLS",id:"profile_urls",level:3}];function d(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:"This guide explains how to configure Richie and OpenEdX to share the OpenEdX connection status\nand display profile information for the logged-in user in Richie."}),"\n",(0,s.jsx)(n.p,{children:"In Richie, the only users that are actually authenticated on the DjangoCMS instance producing the\nsite, are editors and staff users. Your instructors and learners will not have user accounts on\nRichie, but authentication is delegated to a remote service that can be OpenEdX, KeyCloack, or\nyour own centralized identity management service."}),"\n",(0,s.jsx)(n.p,{children:"In the following, we will explain how to use OpenEdX as your authentication delegation service."}),"\n",(0,s.jsx)(n.h2,{id:"prerequisites",children:"Prerequisites"}),"\n",(0,s.jsx)(n.p,{children:"Richie will need to make CORS requests to the OpenEdX instance. As a consequence, you need to\nactivate CORS requests on your OpenEdX instance:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'FEATURES = {\n    ...\n    "ENABLE_CORS_HEADERS": True,\n}\n'})}),"\n",(0,s.jsx)(n.p,{children:"Then, make sure the following settings are set as follows on your OpenEdX instance:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'CORS_ALLOW_CREDENTIALS = True\nCORS_ALLOW_INSECURE = False\nCORS_ORIGIN_ALLOW_ALL = False\nCORS_ORIGIN_WHITELIST: ["richie.example.com"]  # The domain on which Richie is hosted\n'})}),"\n",(0,s.jsx)(n.h2,{id:"allow-redirects",children:"Allow redirects"}),"\n",(0,s.jsxs)(n.p,{children:["When Richie sends the user to the OpenEdX instance for authentication, and wants OpenEdX to\nredirect the user back to Richie after a successful login or signup, it prefixes the path with\n",(0,s.jsx)(n.code,{children:"/richie"}),". Adding the following rule to your Nginx server (or equivalent) and replacing the\nrichie host by yours will allow this redirect to follow through to your Richie instance:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"rewrite ^/richie/(.*)$ https://richie.example.com/$1 permanent;\n"})}),"\n",(0,s.jsx)(n.h2,{id:"configure-authentication-delegation",children:"Configure authentication delegation"}),"\n",(0,s.jsxs)(n.p,{children:["Now, on your Richie instance, you need to configure the service to which Richie will delegate\nauthentication using the ",(0,s.jsx)(n.code,{children:"RICHIE_AUTHENTICATION_DELEGATION"})," setting:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'RICHIE_AUTHENTICATION_DELEGATION = {\n    "BASE_URL": "https://lms.example.com",\n    "BACKEND": "openedx-hawthorn",\n    "PROFILE_URLS": {\n        "dashboard": {\n            "label": _("Dashboard"),\n            "href": "{base_url:s}/dashboard",\n        },\n    },\n}\n'})}),"\n",(0,s.jsx)(n.p,{children:"The following should help you understand how to configure this setting:"}),"\n",(0,s.jsx)(n.h3,{id:"base_url",children:"BASE_URL"}),"\n",(0,s.jsx)(n.p,{children:"The base url on which the OpenEdX instance is hosted. This is used to construct the complete url\nof the login/signup pages to which the frontend application will send the user for authentication."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,s.jsxs)(n.li,{children:["Value: for example ",(0,s.jsx)(n.a,{href:"https://lms.example.com",children:"https://lms.example.com"})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"backend",children:"BACKEND"}),"\n",(0,s.jsx)(n.p,{children:"The name of the ReactJS backend to use for the targeted LMS."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Type: string"}),"\n",(0,s.jsx)(n.li,{children:"Required: Yes"}),"\n",(0,s.jsxs)(n.li,{children:["Value: Richie ships with the following Javascript backends:","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"openedx-dogwood"}),": backend for OpenEdX versions equal to ",(0,s.jsx)(n.code,{children:"dogwood"})," or ",(0,s.jsx)(n.code,{children:"eucalyptus"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"openedx-hawthorn"}),": backend for OpenEdX versions equal to ",(0,s.jsx)(n.code,{children:"hawthorn"})," or higher"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"openedx-fonzie"}),": backend for OpenEdX via ",(0,s.jsx)(n.a,{href:"https://github.com/openfun/fonzie",children:"Fonzie"}),"\n(extra user info and JWT tokens)"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"base"}),": fake backend for development purposes"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"profile_urls",children:"PROFILE_URLS"}),"\n",(0,s.jsx)(n.p,{children:"Mapping definition of custom links presented to the logged-in user as a dropdown menu when he/she\nclicks on his/her username in Richie's page header."}),"\n",(0,s.jsx)(n.p,{children:"Links order will be respected to build the dropdown menu."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Type: dictionary"}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Required: No"}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Value: For example, to emulate the links proposed in OpenEdX, you can configure this setting\nas follows:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'    {\n        "dashboard": {\n            "label": _("Dashboard"),\n            "href": "{base_url:s}/dashboard",\n        },\n        "profile": {\n            "label": _("Profile"),\n            "href": "{base_url:s}/u/(username)",\n        },\n        "account": {\n            "label": _("Account"),\n            "href": "{base_url:s}/account/settings",\n        }\n    }\n'})}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"base_url"})," variable is used as a Python format parameter and will be replaced by the value\nset for the above authentication delegation ",(0,s.jsx)(n.code,{children:"BASE_URL"})," setting."]}),"\n",(0,s.jsxs)(n.p,{children:["If you need to bind user data into a url, wrap the property between brackets. For example, the\nlink configured above for the profile page ",(0,s.jsx)(n.code,{children:"{base_url:s}/u/(username)"})," would point to\n",(0,s.jsx)(n.code,{children:"https://lms.example.com/u/johndoe"})," for a user carrying the username ",(0,s.jsx)(n.code,{children:"johndoe"}),"."]}),"\n"]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},28453:(e,n,i)=>{i.d(n,{R:()=>r,x:()=>l});var s=i(96540);const t={},o=s.createContext(t);function r(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);