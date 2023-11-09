"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[11690],{38439:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>o,toc:()=>d});var t=n(85893),i=n(11151);const r={id:"accessibility-testing",title:"Automated accessibility checks",sidebar_label:"Accessibility testing"},c=void 0,o={id:"accessibility-testing",title:"Automated accessibility checks",description:"Richie includes automated accessibility checks built through a Cypress end-to-end testing infrastructure.",source:"@site/versioned_docs/version-2.0.1/accessibility-testing.md",sourceDirName:".",slug:"/accessibility-testing",permalink:"/docs/2.0.1/accessibility-testing",draft:!1,unlisted:!1,tags:[],version:"2.0.1",lastUpdatedBy:"Mehdi Benadda",lastUpdatedAt:1655108611,formattedLastUpdatedAt:"Jun 13, 2022",frontMatter:{id:"accessibility-testing",title:"Automated accessibility checks",sidebar_label:"Accessibility testing"},sidebar:"docs",previous:{title:"Contributing guide",permalink:"/docs/2.0.1/contributing-guide"},next:{title:"CSS Guidelines",permalink:"/docs/2.0.1/css-guidelines"}},a={},d=[{value:"Testing environment setup",id:"testing-environment-setup",level:2},{value:"Running the tests",id:"running-the-tests",level:2},{value:"Documentation reference",id:"documentation-reference",level:2}];function l(e){const s={a:"a",code:"code",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(s.p,{children:["Richie includes automated accessibility checks built through a ",(0,t.jsx)(s.code,{children:"Cypress"})," end-to-end testing infrastructure."]}),"\n",(0,t.jsx)(s.p,{children:"Automated accessibility checks can only surface around 30% of possible problems in any given page. This does not mean they are not useful, but they cannot replace human audits and developer proficiency."}),"\n",(0,t.jsxs)(s.p,{children:["We use ",(0,t.jsx)(s.code,{children:"axe"})," to run these checks. You can find more about axe on the ",(0,t.jsxs)(s.a,{href:"https://github.com/dequelabs/axe-core",children:[(0,t.jsx)(s.code,{children:"axe-core"})," GitHub repository"]}),"."]}),"\n",(0,t.jsx)(s.h2,{id:"testing-environment-setup",children:"Testing environment setup"}),"\n",(0,t.jsxs)(s.p,{children:["Both ",(0,t.jsx)(s.code,{children:"Cypress"})," and ",(0,t.jsx)(s.code,{children:"axe"})," are used through their respective NPM packages. This means everything goes through ",(0,t.jsx)(s.code,{children:"yarn"})," commands. You need to have ",(0,t.jsx)(s.code,{children:"node"})," and ",(0,t.jsx)(s.code,{children:"yarn"})," installed locally to run the tests."]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-bash",children:"cd tests_e2e\nyarn install\n"})}),"\n",(0,t.jsx)(s.p,{children:"This should install everything you need."}),"\n",(0,t.jsx)(s.h2,{id:"running-the-tests",children:"Running the tests"}),"\n",(0,t.jsxs)(s.p,{children:["There are two way to use the ",(0,t.jsx)(s.code,{children:"Cypress"})," tests: through a terminal-based runner and through the ",(0,t.jsx)(s.code,{children:"Cypress"})," UI. Both are started through ",(0,t.jsx)(s.code,{children:"yarn"})," but they have different use cases."]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-bash",children:"yarn cypress run\n"})}),"\n",(0,t.jsxs)(s.p,{children:["You can start by running the tests directly from the terminal. This is the quickest way to make sure all views pass checks (or find out which ones do not). This is also the starting point for work on running ",(0,t.jsx)(s.code,{children:"Cypress"})," in the CI."]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-bash",children:"yarn cypress open\n"})}),"\n",(0,t.jsxs)(s.p,{children:["This command simply opens the ",(0,t.jsx)(s.code,{children:"Cypress"})," UI. From there, you can run all or some of the test suites with live reloading. This is a great way to understand why some tests are failing, especially when it comes to a11y violations."]}),"\n",(0,t.jsxs)(s.p,{children:["When there are a11y violations, an assertion fails and prints out a list in the ",(0,t.jsx)(s.code,{children:"Cypress"})," UI. You can then click on a violation to print more information in the browser console."]}),"\n",(0,t.jsx)(s.h2,{id:"documentation-reference",children:"Documentation reference"}),"\n",(0,t.jsxs)(s.ul,{children:["\n",(0,t.jsx)(s.li,{children:(0,t.jsxs)(s.a,{href:"https://dequeuniversity.com/rules/axe/3.4",children:["List of all possible violations covered by ",(0,t.jsx)(s.code,{children:"axe"})]})}),"\n",(0,t.jsx)(s.li,{children:(0,t.jsxs)(s.a,{href:"https://docs.cypress.io",children:[(0,t.jsx)(s.code,{children:"Cypress"})," documentation"]})}),"\n",(0,t.jsx)(s.li,{children:(0,t.jsxs)(s.a,{href:"https://github.com/avanslaars/cypress-axe",children:[(0,t.jsx)(s.code,{children:"axe"})," and ",(0,t.jsx)(s.code,{children:"Cypress"})," integration"]})}),"\n"]})]})}function h(e={}){const{wrapper:s}={...(0,i.a)(),...e.components};return s?(0,t.jsx)(s,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}},11151:(e,s,n)=>{n.d(s,{Z:()=>o,a:()=>c});var t=n(67294);const i={},r=t.createContext(i);function c(e){const s=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function o(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:c(e.components),t.createElement(r.Provider,{value:s},e.children)}}}]);