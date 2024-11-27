"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[26388],{25485:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var o=s(74848),t=s(28453);const i={id:"installation",title:"Installing Richie for development",sidebar_label:"Installation"},r=void 0,c={id:"installation",title:"Installing Richie for development",description:"Richie is a container-native application but can also be installed",source:"@site/versioned_docs/version-2.26.0/installation.md",sourceDirName:".",slug:"/installation",permalink:"/docs/2.26.0/installation",draft:!1,unlisted:!1,tags:[],version:"2.26.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1716383183e3,frontMatter:{id:"installation",title:"Installing Richie for development",sidebar_label:"Installation"},sidebar:"docs",previous:{title:"Web Analytics",permalink:"/docs/2.26.0/web-analytics"},next:{title:"Docker development",permalink:"/docs/2.26.0/docker-development"}},a={},l=[{value:"Docker",id:"docker",level:2},{value:"Project bootstrap",id:"project-bootstrap",level:3},{value:"Adding content",id:"adding-content",level:3},{value:"Connecting Richie to an LMS",id:"connecting-richie-to-an-lms",level:2}];function d(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.code,{children:"Richie"})," is a ",(0,o.jsx)(n.strong,{children:"container-native application"})," but can also be installed\n",(0,o.jsx)(n.a,{href:"/docs/2.26.0/native-installation",children:"on your machine"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["For development, the project is defined using a\n",(0,o.jsx)(n.a,{href:"../docker-compose.yml",children:"docker-compose file"})," and consists of:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"3 running services:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"database"}),": ",(0,o.jsx)(n.code,{children:"postgresql"})," or ",(0,o.jsx)(n.code,{children:"mysql"})," at your preference,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"elasticsearch"}),": the search engine,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"app"}),": the actual ",(0,o.jsx)(n.code,{children:"DjangoCMS"})," project with all our application code."]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"2 containers for building purposes:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"node"}),": used for front-end related tasks, ",(0,o.jsx)(n.em,{children:"i.e."})," transpiling\n",(0,o.jsx)(n.code,{children:"TypeScript"})," sources, bundling them into a JS package, and building the\nCSS files from Sass sources,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"crowdin"}),": used to upload and retrieve i18n files to and from the\n",(0,o.jsx)(n.a,{href:"https://crowdin.com/",children:"Crowding"})," service that we use to crowd source\ntranslations,"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:['At "France Universit\xe9 Num\xe9rique", we deploy our applications on ',(0,o.jsx)(n.code,{children:"Kubernetes"}),"\nusing ",(0,o.jsx)(n.a,{href:"https://github.com/openfun/arnold",children:(0,o.jsx)(n.code,{children:"Arnold"})}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"docker",children:"Docker"}),"\n",(0,o.jsxs)(n.p,{children:["First, make sure you have a recent version of Docker and\n",(0,o.jsx)(n.a,{href:"https://docs.docker.com/compose/install",children:"Docker Compose"})," installed on your\nlaptop:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"$ docker -v\n  Docker version 26.0.0, build 2ae903e\n\n$ docker compose --version\n  Docker Compose version v2.25.0\n"})}),"\n",(0,o.jsxs)(n.p,{children:["\u26a0\ufe0f You may need to run the following commands with ",(0,o.jsx)(n.code,{children:"sudo"})," but this can be\navoided by assigning your user to the ",(0,o.jsx)(n.code,{children:"docker"})," group."]}),"\n",(0,o.jsx)(n.h3,{id:"project-bootstrap",children:"Project bootstrap"}),"\n",(0,o.jsxs)(n.p,{children:["The easiest way to start working on the project is to use our ",(0,o.jsx)(n.code,{children:"Makefile"}),":"]}),"\n",(0,o.jsx)(n.p,{children:"$ make bootstrap"}),"\n",(0,o.jsxs)(n.p,{children:["This command builds the ",(0,o.jsx)(n.code,{children:"app"})," container, installs front-end and back-end\ndependencies, builds the front-end application and styles, and performs\ndatabase migrations. It's a good idea to use this command each time you are\npulling code from the project repository to avoid dependency-related or\nmigration-related issues."]}),"\n",(0,o.jsxs)(n.p,{children:["Now that your ",(0,o.jsx)(n.code,{children:"Docker"})," services are ready to be used, start the full CMS by\nrunning:"]}),"\n",(0,o.jsx)(n.p,{children:"$ make run"}),"\n",(0,o.jsx)(n.h3,{id:"adding-content",children:"Adding content"}),"\n",(0,o.jsx)(n.p,{children:"Once the CMS is up and running, you can create a superuser account:"}),"\n",(0,o.jsx)(n.p,{children:"$ make superuser"}),"\n",(0,o.jsx)(n.p,{children:"You can create a basic demo site by running:"}),"\n",(0,o.jsx)(n.p,{children:"$ make demo-site"}),"\n",(0,o.jsx)(n.p,{children:"Note that if you don't create the demo site and start from a blank CMS, you\nwill get some errors requesting you to create some required root pages. So it\nis easier as a first approach to test the CMS with the demo site."}),"\n",(0,o.jsxs)(n.p,{children:["You should be able to view the site at ",(0,o.jsx)(n.a,{href:"http://localhost:8070",children:"localhost:8070"})]}),"\n",(0,o.jsx)(n.h2,{id:"connecting-richie-to-an-lms",children:"Connecting Richie to an LMS"}),"\n",(0,o.jsx)(n.p,{children:"It is possible to use Richie as a catalogue aggregating courses from one or\nmore LMS without any specific connection. In this case, each course run in\nthe catalogue points to a course on the LMS, and the LMS points back to the\ncatalogue to browse courses."}),"\n",(0,o.jsxs)(n.p,{children:["This approach is used for example on ",(0,o.jsx)(n.a,{href:"https://www.fun-campus.fr",children:"https://www.fun-campus.fr"})," or\n",(0,o.jsx)(n.a,{href:"https://catalogue.edulib.org",children:"https://catalogue.edulib.org"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["For a seamless user experience, it is possible to connect a Richie instance\nto an OpenEdX instance (or some other LMS like Moodle at the cost of minor\nadaptations), in several ways that we explain in the\n",(0,o.jsx)(n.a,{href:"lms-connection",children:"LMS connection guide"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["This approach is used for example on ",(0,o.jsx)(n.a,{href:"https://www.fun-mooc.fr",children:"https://www.fun-mooc.fr"})," or\n",(0,o.jsx)(n.a,{href:"https://www.nau.edu.pt",children:"https://www.nau.edu.pt"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},28453:(e,n,s)=>{s.d(n,{R:()=>r,x:()=>c});var o=s(96540);const t={},i=o.createContext(t);function r(e){const n=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),o.createElement(i.Provider,{value:n},e.children)}}}]);