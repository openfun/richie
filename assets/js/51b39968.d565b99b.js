"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[23112],{52387:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>d,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>t,toc:()=>a});const t=JSON.parse('{"id":"discover","title":"Getting started with Richie","description":"If you\'re just looking for a quick preview of Richie, you can take a look and have a tour of Richie on our dedicated demo site.","source":"@site/versioned_docs/version-2.6.0/quick-start.md","sourceDirName":".","slug":"/discover","permalink":"/docs/2.6.0/discover","draft":false,"unlisted":false,"tags":[],"version":"2.6.0","lastUpdatedBy":"Mehdi Benadda","lastUpdatedAt":1655108611000,"frontMatter":{"id":"discover","title":"Getting started with Richie","sidebar_label":"Quick start"},"sidebar":"docs","next":{"title":"Docker development","permalink":"/docs/2.6.0/docker-development"}}');var i=o(74848),s=o(28453);const r={id:"discover",title:"Getting started with Richie",sidebar_label:"Quick start"},c=void 0,d={},a=[{value:"Architecture",id:"architecture",level:2},{value:"Getting started",id:"getting-started",level:2},{value:"Docker",id:"docker",level:3},{value:"Project bootstrap",id:"project-bootstrap",level:3},{value:"Adding content",id:"adding-content",level:3},{value:"Basic - Connecting Richie to OpenEdx",id:"basic---connecting-richie-to-openedx",level:3},{value:"Advanced - Connecting Richie to OpenEdx",id:"advanced---connecting-richie-to-openedx",level:3}];function l(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["If you're just looking for a quick preview of ",(0,i.jsx)(n.code,{children:"Richie"}),", you can take a look and have a tour of ",(0,i.jsx)(n.code,{children:"Richie"})," on our dedicated ",(0,i.jsx)(n.a,{href:"https://demo.richie.education",children:"demo site"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["Login/password are ",(0,i.jsx)(n.code,{children:"admin"}),"/",(0,i.jsx)(n.code,{children:"admin"}),". The database is regularly flushed."]}),"\n",(0,i.jsx)(n.h2,{id:"architecture",children:"Architecture"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"Richie"})," is a ",(0,i.jsx)(n.strong,{children:"container-native application"})," but can also be installed\n",(0,i.jsx)(n.a,{href:"/docs/2.6.0/native-installation",children:"on your machine"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["For development, the project is defined using a ",(0,i.jsx)(n.a,{href:"../docker-compose.yml",children:"docker-compose file"})," and\nconsists of 4 services:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"db"}),": the ",(0,i.jsx)(n.code,{children:"Postgresql"})," database,"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"elasticsearch"}),": the search engine,"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"app"}),": the actual ",(0,i.jsx)(n.code,{children:"DjangoCMS"})," project with all our application code,"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"node"}),": used for front-end related tasks, ",(0,i.jsx)(n.em,{children:"i.e."})," transpiling ",(0,i.jsx)(n.code,{children:"TypeScript"})," sources, bundling\nthem into a JS package, and building the CSS files from Sass sources."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:['At "France Universit\xe9 Num\xe9rique", we deploy our applications on ',(0,i.jsx)(n.code,{children:"OpenShift"}),"/",(0,i.jsx)(n.code,{children:"Kubernetes"})," using\n",(0,i.jsx)(n.a,{href:"https://github.com/openfun/arnold",children:(0,i.jsx)(n.code,{children:"Arnold"})}),"."]}),"\n",(0,i.jsx)(n.h2,{id:"getting-started",children:"Getting started"}),"\n",(0,i.jsx)(n.h3,{id:"docker",children:"Docker"}),"\n",(0,i.jsxs)(n.p,{children:["First, make sure you have a recent version of Docker and\n",(0,i.jsx)(n.a,{href:"https://docs.docker.com/compose/install",children:"Docker Compose"})," installed on your laptop:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"$ docker -v\n  Docker version 1.13.1, build 092cba3\n\n$ docker-compose --version\n  docker-compose version 1.17.1, build 6d101fb\n"})}),"\n",(0,i.jsxs)(n.p,{children:["\u26a0\ufe0f You may need to run the following commands with ",(0,i.jsx)(n.code,{children:"sudo"})," but this can be avoided by assigning your\nuser to the ",(0,i.jsx)(n.code,{children:"docker"})," group."]}),"\n",(0,i.jsx)(n.h3,{id:"project-bootstrap",children:"Project bootstrap"}),"\n",(0,i.jsxs)(n.p,{children:["The easiest way to start working on the project is to use our ",(0,i.jsx)(n.code,{children:"Makefile"}),":"]}),"\n",(0,i.jsx)(n.p,{children:"$ make bootstrap"}),"\n",(0,i.jsxs)(n.p,{children:["This command builds the ",(0,i.jsx)(n.code,{children:"app"})," container, installs front-end and back-end dependencies, builds the\nfront-end application and styles, and performs database migrations. It's a good idea to use this\ncommand each time you are pulling code from the project repository to avoid dependency-related or\nmigration-related issues."]}),"\n",(0,i.jsxs)(n.p,{children:["Now that your ",(0,i.jsx)(n.code,{children:"Docker"})," services are ready to be used, start the full CMS by running:"]}),"\n",(0,i.jsx)(n.p,{children:"$ make run"}),"\n",(0,i.jsx)(n.h3,{id:"adding-content",children:"Adding content"}),"\n",(0,i.jsx)(n.p,{children:"Once the CMS is up and running, you can create a superuser account:"}),"\n",(0,i.jsx)(n.p,{children:"$ make superuser"}),"\n",(0,i.jsx)(n.p,{children:"You can create a basic demo site by running:"}),"\n",(0,i.jsx)(n.p,{children:"$ make demo-site"}),"\n",(0,i.jsx)(n.p,{children:"Note that if you don't create the demo site and start from a blank CMS, you will get some errors\nrequesting you to create some required root pages. So it is easier as a first approach to test the\nCMS with the demo site."}),"\n",(0,i.jsxs)(n.p,{children:["You should be able to view the site at ",(0,i.jsx)(n.a,{href:"http://localhost:8070",children:"localhost:8070"})]}),"\n",(0,i.jsx)(n.h3,{id:"basic---connecting-richie-to-openedx",children:"Basic - Connecting Richie to OpenEdx"}),"\n",(0,i.jsxs)(n.p,{children:["This project is pre-configured to connect with an OpenEdx instance started with\n[OpenEdx Docker](",(0,i.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker",children:"https://github.com/openfun/openedx-docker"}),"], which provides a ready to use\ndocker-compose stack of OpenEdx in several flavors. Head over to\n",(0,i.jsx)(n.a,{href:"https://github.com/openfun/openedx-docker#readme",children:"OpenEdx Docker README"})," for instructions on how\nto bootstrap an instance."]}),"\n",(0,i.jsxs)(n.p,{children:["Just start apps with ",(0,i.jsx)(n.code,{children:"make run"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["Richie should respond on ",(0,i.jsx)(n.code,{children:"http://localhost:8070"})," and OpenEdx on ",(0,i.jsx)(n.code,{children:"http://localhost:8073"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"advanced---connecting-richie-to-openedx",children:"Advanced - Connecting Richie to OpenEdx"}),"\n",(0,i.jsxs)(n.p,{children:["If you want users to enroll on courses in OpenEdx directly from Richie via API calls, you should\nread ",(0,i.jsx)(n.a,{href:"/docs/2.6.0/lms-connection#connecting-richie-and-openedx-over-tls",children:"the advanced guide"})," to connect\nRichie to OpenEdx over TLS."]})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},28453:(e,n,o)=>{o.d(n,{R:()=>r,x:()=>c});var t=o(96540);const i={},s=t.createContext(i);function r(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);