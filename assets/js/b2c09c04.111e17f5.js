"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[7402],{25667:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>d,contentTitle:()=>c,default:()=>u,frontMatter:()=>s,metadata:()=>t,toc:()=>a});const t=JSON.parse('{"id":"building-the-frontend","title":"Building Richie\'s frontend in your own project","description":"Richie offers plenty of opportunities to customize the way it works and make it suit the needs of your own project. Most of these go through Django settings.","source":"@site/../docs/building-the-frontend.md","sourceDirName":".","slug":"/building-the-frontend","permalink":"/docs/next/building-the-frontend","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1604333870000,"frontMatter":{"id":"building-the-frontend","title":"Building Richie\'s frontend in your own project","sidebar_label":"Building the frontend"},"sidebar":"docs","previous":{"title":"Django & React","permalink":"/docs/next/django-react-interop"},"next":{"title":"Frontend overrides","permalink":"/docs/next/frontend-overrides"}}');var o=i(74848),r=i(28453);const s={id:"building-the-frontend",title:"Building Richie's frontend in your own project",sidebar_label:"Building the frontend"},c=void 0,d={},a=[{value:"Installing <code>richie-education</code>",id:"installing-richie-education",level:2},{value:"Building the Javascript bundle",id:"building-the-javascript-bundle",level:2},{value:"Building the CSS",id:"building-the-css",level:2}];function l(e){const n={code:"code",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.p,{children:"Richie offers plenty of opportunities to customize the way it works and make it suit the needs of your own project. Most of these go through Django settings."}),"\n",(0,o.jsx)(n.p,{children:"Part of Richie is a React frontend however. If you want to change how it works in ways that cannot be changed from the Django settings, you will need to build your own frontend."}),"\n",(0,o.jsxs)(n.h2,{id:"installing-richie-education",children:["Installing ",(0,o.jsx)(n.code,{children:"richie-education"})]}),"\n",(0,o.jsx)(n.p,{children:"If you have not already, you should create a directory for the frontend in your project. We recommend you mirror Richie's file structure so it's easier to keep track of the changes you make."}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"mkdir -p src/frontend\n"})}),"\n",(0,o.jsx)(n.p,{children:"Then, you need to bootstrap your own frontend project in this new directory."}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"cd src/frontend\nyarn init\n"})}),"\n",(0,o.jsxs)(n.p,{children:["With each version of Richie, we build and publish an ",(0,o.jsx)(n.code,{children:"NPM"})," package to enable Richie users to build their own Javascript and CSS. You're now ready to install it."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"yarn add richie-education\n"})}),"\n",(0,o.jsxs)(n.p,{children:["In your ",(0,o.jsx)(n.code,{children:"package.json"})," file, you should see it in the list of dependencies. Also, there's a ",(0,o.jsx)(n.code,{children:"node_modules"})," directory where the package and its dependencies are actually installed."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-json",children:'"dependencies": {\n    "richie-education": "1.12.0"\n},\n'})}),"\n",(0,o.jsx)(n.h2,{id:"building-the-javascript-bundle",children:"Building the Javascript bundle"}),"\n",(0,o.jsx)(n.p,{children:"You are now ready to run your own frontend build. We'll just be using webpack directly."}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"yarn webpack --config node_modules/richie-education/webpack.config.js --output-path ./build --richie-dependent-build\n"})}),"\n",(0,o.jsx)(n.p,{children:"Here is everything that is happening:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"yarn webpack"})," \u2014 run the webpack CLI;"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--config node_modules/richie-education/webpack.config.js"})," \u2014 point webpack to ",(0,o.jsx)(n.code,{children:"richie-education"}),"'s webpack config file;"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--output-path ./build"})," \u2014 make sure we get our output where we need it to be;"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--richie-dependent-build"})," \u2014 enable some affordances with import paths. We pre-configured Richie's webpack to be able to run it from a dependent project."]}),"\n"]}),"\n",(0,o.jsx)(n.p,{children:"You can now run your build to change frontend settings or override frontend components with your own."}),"\n",(0,o.jsx)(n.h2,{id:"building-the-css",children:"Building the CSS"}),"\n",(0,o.jsx)(n.p,{children:"If you want to change styles in Richie, or add new styles for components & templates you develop yourself, you can run the SASS/CSS build yourself."}),"\n",(0,o.jsxs)(n.p,{children:["Start by creating your own ",(0,o.jsx)(n.code,{children:"main"})," file. The ",(0,o.jsx)(n.code,{children:"_"})," underscore at the beginning is there to prevent sass from auto-compiling the file."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"mkdir -p src/frontend/scss\ntouch src/frontend/scss/_mains.scss\n"})}),"\n",(0,o.jsxs)(n.p,{children:["Start by importing Richie's main scss file. If you prefer, you can also directly import any files you want to include \u2014 in effect re-doing Richie's ",(0,o.jsx)(n.code,{children:"_main.scss"})," on your own."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-sass",children:'@import "richie-education/scss/main";\n'})}),"\n",(0,o.jsx)(n.p,{children:"You are now ready to run the CSS build:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"cd src/frontend\nyarn build-sass\n"})}),"\n",(0,o.jsx)(n.p,{children:"This gives you one output CSS file that you can put in the static files directory of your project and use to override Richie's style or add your own parts."})]})}function u(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},28453:(e,n,i)=>{i.d(n,{R:()=>s,x:()=>c});var t=i(96540);const o={},r=t.createContext(o);function s(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);