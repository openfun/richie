"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[11397],{60312:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>a,contentTitle:()=>s,default:()=>h,frontMatter:()=>n,metadata:()=>c,toc:()=>l});var i=o(85893),r=o(11151);const n={id:"cookiecutter",title:"Start your own site",sidebar_label:"Start your own site"},s=void 0,c={id:"cookiecutter",title:"Start your own site",description:"We use Cookiecutter to help you",source:"@site/versioned_docs/version-2.25.0/cookiecutter.md",sourceDirName:".",slug:"/cookiecutter",permalink:"/docs/cookiecutter",draft:!1,unlisted:!1,tags:[],version:"2.25.0",lastUpdatedBy:"Manuel Raynaud",lastUpdatedAt:1712836499e3,frontMatter:{id:"cookiecutter",title:"Start your own site",sidebar_label:"Start your own site"},sidebar:"docs",previous:{title:"Discover Richie",permalink:"/docs/discover"},next:{title:"Search filters customization",permalink:"/docs/filters-customization"}},a={},l=[{value:"Run Cookiecutter",id:"run-cookiecutter",level:2},{value:"Bootstrap your project",id:"bootstrap-your-project",level:3},{value:"Theming",id:"theming",level:2},{value:"Update your Richie site factory",id:"update-your-richie-site-factory",level:2},{value:"Help us improve this project",id:"help-us-improve-this-project",level:2}];function d(e){const t={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(t.p,{children:["We use ",(0,i.jsx)(t.a,{href:"https://github.com/audreyr/cookiecutter",children:"Cookiecutter"})," to help you\nset up a production-ready learning portal website based on\n",(0,i.jsx)(t.a,{href:"https://github.com/openfun/richie",children:"Richie"})," in seconds."]}),"\n",(0,i.jsx)(t.h2,{id:"run-cookiecutter",children:"Run Cookiecutter"}),"\n",(0,i.jsx)(t.p,{children:"There are 2 options to run Cookiecutter:"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.a,{href:"https://cookiecutter.readthedocs.io/en/latest/installation.html",children:"install it on your machine"})}),"\n",(0,i.jsx)(t.li,{children:"run it with Docker"}),"\n"]}),"\n",(0,i.jsx)(t.p,{children:"While you think of it, navigate to the directory in which you want to create\nyour site factory:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"cd /path/to/your/code/directory\n"})}),"\n",(0,i.jsxs)(t.p,{children:["If you chose to install Cookiecutter, you can now run it against our\n",(0,i.jsx)(t.a,{href:"https://github.com/openfun/richie/tree/master/cookiecutter",children:"template"})," as follows:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"cookiecutter gh:openfun/richie --directory cookiecutter  --checkout v2.25.0\n"})}),"\n",(0,i.jsxs)(t.p,{children:["If you didn't want to install it on your machine, we provide a Docker image\nbuilt with our ",(0,i.jsx)(t.a,{href:"https://github.com/openfun/dockerfiles",children:"own repository"})," that you can use as follows:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"docker run --rm -it -u $(id -u):$(id -g) -v $PWD:/app \\\nfundocker/cookiecutter gh:openfun/richie --directory cookiecutter --checkout v2.25.0\n"})}),"\n",(0,i.jsxs)(t.p,{children:["The ",(0,i.jsx)(t.code,{children:"--directory"})," option is to indicate that our Cookiecutter template is in\na ",(0,i.jsx)(t.code,{children:"cookiecutter"})," directory inside our git repository and not at the root."]}),"\n",(0,i.jsxs)(t.p,{children:['You will be prompted to enter an organization name, which will determine the\nname of your repository. For example, if you choose "foo" as organization\nname, your repository will be named ',(0,i.jsx)(t.code,{children:"foo-richie-site-factory"}),". It's\nnice if you keep it that way so all richie site factories follow this\nconvention."]}),"\n",(0,i.jsx)(t.p,{children:"When you confirm the organization name, Cookiecutter will generate your\nproject from the Cookiecutter template and place it at the level where you\ncurrently are."}),"\n",(0,i.jsx)(t.h3,{id:"bootstrap-your-project",children:"Bootstrap your project"}),"\n",(0,i.jsx)(t.p,{children:"Enter the newly created project and add a new site to your site factory:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"cd foo-richie-site-factory\nmake add-site\n"})}),"\n",(0,i.jsxs)(t.p,{children:["This script also uses Cookiecutter against our ",(0,i.jsx)(t.a,{href:"https://github.com/openfun/richie/tree/master/cookiecutter/%7B%7Bcookiecutter.organization%7D%7D-richie-site-factory/template",children:"site template"}),"."]}),"\n",(0,i.jsx)(t.p,{children:"Once your new site is created, activate it:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"bin/activate\n"})}),"\n",(0,i.jsx)(t.p,{children:"Now bootstrap the site to build its docker image, create its media folder,\ndatabase, etc.:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"make bootstrap\n"})}),"\n",(0,i.jsxs)(t.p,{children:["Once the bootstrap phase is finished, you should be able to view the site at\n",(0,i.jsx)(t.a,{href:"http://localhost:8070",children:"localhost:8070"}),"."]}),"\n",(0,i.jsx)(t.p,{children:"You can create a full fledge demo to test your site by running:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-bash",children:"make demo-site\n"})}),"\n",(0,i.jsx)(t.p,{children:"Note that the README of your newly created site factory contains detailed\ninformation about how to configure and run a site."}),"\n",(0,i.jsx)(t.p,{children:"Once you're happy with your site, don't forget to backup your work e.g. by\ncommitting it and pushing it to a new git repository."}),"\n",(0,i.jsx)(t.h2,{id:"theming",children:"Theming"}),"\n",(0,i.jsx)(t.p,{children:"You probably want to change the default theme. The cookiecutter adds an extra scss frontend folder with a couple of templates that you can use to change the default styling of the site."}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.code,{children:"sites/<site>/src/frontend/scss/extras/colors/_palette.scss"})}),"\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.code,{children:"sites/<site>/src/frontend/scss/extras/colors/_theme.scss"})}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["To change the default logo of the site, you need to create the folder ",(0,i.jsx)(t.code,{children:"sites/<site>/src/backend/base/static/richie/images"})," and then override the new ",(0,i.jsx)(t.code,{children:"logo.png"})," picture."]}),"\n",(0,i.jsx)(t.p,{children:"For more advanced customization, refer to our recipes:"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.a,{href:"/docs/filters-customization",children:"How to customize search filters"})}),"\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.a,{href:"/docs/frontend-overrides",children:"How to override frontend components in Richie"})}),"\n"]}),"\n",(0,i.jsx)(t.h2,{id:"update-your-richie-site-factory",children:"Update your Richie site factory"}),"\n",(0,i.jsxs)(t.p,{children:["If we later improve our scripts, you will be able to update your own site\nfactory by replaying Cookiecutter. This will override your files in the\nproject's scaffolding but, don't worry, it will respect all the sites you\nwill have created in the ",(0,i.jsx)(t.code,{children:"sites"})," directory:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"cookiecutter --overwrite-if-exists gh:openfun/richie --directory=cookiecutter\n"})}),"\n",(0,i.jsx)(t.h2,{id:"help-us-improve-this-project",children:"Help us improve this project"}),"\n",(0,i.jsx)(t.p,{children:"After starting your project, please submit an issue let us know how it went and\nwhat other features we should add to make it better."})]})}function h(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},11151:(e,t,o)=>{o.d(t,{Z:()=>c,a:()=>s});var i=o(67294);const r={},n=i.createContext(r);function s(e){const t=i.useContext(n);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),i.createElement(n.Provider,{value:t},e.children)}}}]);