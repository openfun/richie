"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[81866],{88032:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>d,default:()=>u,frontMatter:()=>s,metadata:()=>i,toc:()=>a});const i=JSON.parse('{"id":"contributing-guide","title":"Contributing guide","description":"This project is intended to be community-driven, so please, do not hesitate to get in touch if you have any question related to our implementation or design decisions.","source":"@site/versioned_docs/version-2.6.0/contributing.md","sourceDirName":".","slug":"/contributing-guide","permalink":"/docs/2.6.0/contributing-guide","draft":false,"unlisted":false,"tags":[],"version":"2.6.0","lastUpdatedBy":"Mehdi Benadda","lastUpdatedAt":1655108611000,"frontMatter":{"id":"contributing-guide","title":"Contributing guide","sidebar_label":"Contributing guide"},"sidebar":"docs","previous":{"title":"LMS connection","permalink":"/docs/2.6.0/lms-connection"},"next":{"title":"Accessibility testing","permalink":"/docs/2.6.0/accessibility-testing"}}');var o=t(74848),r=t(28453);const s={id:"contributing-guide",title:"Contributing guide",sidebar_label:"Contributing guide"},d=void 0,c={},a=[{value:"Checking your code",id:"checking-your-code",level:2},{value:"Running tests",id:"running-tests",level:2},{value:"Running migrations",id:"running-migrations",level:2},{value:"Handling new dependencies",id:"handling-new-dependencies",level:2},{value:"Going further",id:"going-further",level:2}];function l(e){const n={a:"a",code:"code",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,r.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.p,{children:"This project is intended to be community-driven, so please, do not hesitate to get in touch if you have any question related to our implementation or design decisions."}),"\n",(0,o.jsxs)(n.p,{children:["We try to raise our code quality standards and expect contributors to follow the recommandations\nfrom our ",(0,o.jsx)(n.a,{href:"https://openfun.gitbooks.io/handbook/content",children:"handbook"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"checking-your-code",children:"Checking your code"}),"\n",(0,o.jsx)(n.p,{children:"We use strict flake8, pylint, isort and black linters to check the validity of our backend code:"}),"\n",(0,o.jsx)(n.p,{children:"$ make lint-back"}),"\n",(0,o.jsx)(n.p,{children:"We use strict eslint and prettier to check the validity of our frontend code:"}),"\n",(0,o.jsx)(n.p,{children:"$ make lint-front"}),"\n",(0,o.jsx)(n.h2,{id:"running-tests",children:"Running tests"}),"\n",(0,o.jsx)(n.p,{children:"On the backend, we use pytest to run our test suite:"}),"\n",(0,o.jsx)(n.p,{children:"$ make test-back"}),"\n",(0,o.jsx)(n.p,{children:"On the frontend, we use karma to run our test suite:"}),"\n",(0,o.jsx)(n.p,{children:"$ make test-front"}),"\n",(0,o.jsx)(n.h2,{id:"running-migrations",children:"Running migrations"}),"\n",(0,o.jsxs)(n.p,{children:["The first time you start the project with ",(0,o.jsx)(n.code,{children:"make bootstrap"}),", the ",(0,o.jsx)(n.code,{children:"db"})," container automatically\ncreates a fresh database named ",(0,o.jsx)(n.code,{children:"richie"})," and performs database migrations. Each time a new\n",(0,o.jsx)(n.strong,{children:"database migration"})," is added to the code, you can synchronize the database schema by running:"]}),"\n",(0,o.jsx)(n.p,{children:"$ make migrate"}),"\n",(0,o.jsx)(n.h2,{id:"handling-new-dependencies",children:"Handling new dependencies"}),"\n",(0,o.jsx)(n.p,{children:"Each time you add new front-end or back-end dependencies, you will need to rebuild the\napplication. We recommend to use:"}),"\n",(0,o.jsx)(n.p,{children:"$ make bootstrap"}),"\n",(0,o.jsx)(n.h2,{id:"going-further",children:"Going further"}),"\n",(0,o.jsx)(n.p,{children:"To see all available commands, run:"}),"\n",(0,o.jsx)(n.p,{children:"$ make"}),"\n",(0,o.jsxs)(n.p,{children:["We also provide shortcuts for docker-compose commands as sugar scripts in the\n",(0,o.jsx)(n.code,{children:"bin/"})," directory:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"bin\n\u251c\u2500\u2500 exec\n\u251c\u2500\u2500 pylint\n\u251c\u2500\u2500 pytest\n\u2514\u2500\u2500 run\n"})}),"\n",(0,o.jsxs)(n.p,{children:["More details and tips & tricks can be found in our ",(0,o.jsx)(n.a,{href:"/docs/2.6.0/docker-development",children:"development with Docker\ndocumentation"})]})]})}function u(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},28453:(e,n,t)=>{t.d(n,{R:()=>s,x:()=>d});var i=t(96540);const o={},r=i.createContext(o);function s(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);