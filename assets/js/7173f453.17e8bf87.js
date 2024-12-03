"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[84019],{58700:(e,s,t)=>{t.r(s),t.d(s,{assets:()=>a,contentTitle:()=>l,default:()=>u,frontMatter:()=>r,metadata:()=>n,toc:()=>c});const n=JSON.parse('{"id":"css-guidelines","title":"CSS Guidelines","description":"The purpose of these CSS guidelines is to make our CSS as easy as possible to maintain, prune and/or modify over time. To that end, they forgo some of the unwanted parts of CSS. They also require the use of a CSS preprocessor (we picked SASS) to be used effortlessly.","source":"@site/versioned_docs/version-2.7.0/css-guidelines.md","sourceDirName":".","slug":"/css-guidelines","permalink":"/docs/2.7.0/css-guidelines","draft":false,"unlisted":false,"tags":[],"version":"2.7.0","lastUpdatedBy":"Mehdi Benadda","lastUpdatedAt":1655108611000,"frontMatter":{"id":"css-guidelines","title":"CSS Guidelines","sidebar_label":"CSS Guidelines"},"sidebar":"docs","previous":{"title":"Accessibility testing","permalink":"/docs/2.7.0/accessibility-testing"}}');var i=t(74848),o=t(28453);const r={id:"css-guidelines",title:"CSS Guidelines",sidebar_label:"CSS Guidelines"},l=void 0,a={},c=[{value:"File structuration",id:"file-structuration",level:2},{value:"Code structuration",id:"code-structuration",level:2},{value:"Quick pointers",id:"quick-pointers",level:2}];function d(e){const s={a:"a",code:"code",em:"em",h2:"h2",li:"li",p:"p",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.p,{children:"The purpose of these CSS guidelines is to make our CSS as easy as possible to maintain, prune and/or modify over time. To that end, they forgo some of the unwanted parts of CSS. They also require the use of a CSS preprocessor (we picked SASS) to be used effortlessly."}),"\n",(0,i.jsx)(s.p,{children:"Our approach is two-pronged. First, we put every piece of CSS as close as we can to the place it is used in a template or component. Second, we use strict class naming rules that act as a replacement to CSS selector combinations."}),"\n",(0,i.jsx)(s.h2,{id:"file-structuration",children:"File structuration"}),"\n",(0,i.jsx)(s.p,{children:"Rules should be placed where their purpose is most apparent, and where they are easiest to find."}),"\n",(0,i.jsxs)(s.p,{children:["Generally, this means CSS rules should live as close as possible to the place they are used. For example, the selectors and rules that define the look for a component should live in a ",(0,i.jsx)(s.code,{children:".scss"})," file in the same folder as the JS file for this component. This goes for templates too. Such files can only contain rules that are ",(0,i.jsx)(s.strong,{children:"specific to this component/template and this one only"})]}),"\n",(0,i.jsxs)(s.p,{children:["Only general base rules, utility rules, site layout rules as well as our custom variables should live in the central ",(0,i.jsx)(s.code,{children:"app/static/scss"})," folder."]}),"\n",(0,i.jsx)(s.h2,{id:"code-structuration",children:"Code structuration"}),"\n",(0,i.jsx)(s.p,{children:"In order to understand what classes are about at a glance and avoid collisions, naming conventions must be enforced for classes."}),"\n",(0,i.jsxs)(s.p,{children:["Following the ",(0,i.jsx)(s.a,{href:"http://getbem.com/introduction/",children:"BEM naming convention"}),", we will write our classes as follows :"]}),"\n",(0,i.jsxs)(s.p,{children:[".block ","\n.block__element ","\n.block--modifier "]}),"\n",(0,i.jsxs)(s.ul,{children:["\n",(0,i.jsxs)(s.li,{children:[(0,i.jsx)(s.code,{children:".block"})," represents the higher level of an abstraction or component."]}),"\n",(0,i.jsxs)(s.li,{children:[(0,i.jsx)(s.code,{children:".block__element"})," represents a descendent of .block that helps form .block as a whole."]}),"\n",(0,i.jsxs)(s.li,{children:[(0,i.jsx)(s.code,{children:".block--modifier"})," represents a different state or version of .block."]}),"\n"]}),"\n",(0,i.jsxs)(s.p,{children:["We use double hyphens and double underscores as delimiters so that names themselves can be hyphen-delimited (e.g. ",(0,i.jsx)(s.code,{children:".site-search__field--full"}),")."]}),"\n",(0,i.jsx)(s.p,{children:"Yes, this notation is ugly. However, it allows our classes to express what they are doing. Both our CSS and our markup become more meaningful. It allows us to easily see what classes are related to others, and how they are related, when we look at the markup."}),"\n",(0,i.jsx)(s.h2,{id:"quick-pointers",children:"Quick pointers"}),"\n",(0,i.jsxs)(s.ul,{children:["\n",(0,i.jsxs)(s.li,{children:["In general, ",(0,i.jsx)(s.strong,{children:"do not use IDs"}),". ",(0,i.jsx)(s.em,{children:"They can cause specificity wars and are not supposed to be reusable, and are therefore not very useful."})]}),"\n",(0,i.jsxs)(s.li,{children:["Do not nest selectors unnecessarily. ",(0,i.jsx)(s.em,{children:"It will increase specificity and affect where else you can use your styles."})]}),"\n",(0,i.jsxs)(s.li,{children:["Do not qualify selectors unnecessarily. ",(0,i.jsx)(s.em,{children:"It will impact the number of different elements you can apply styles to."})]}),"\n",(0,i.jsxs)(s.li,{children:["Comment profusely, ",(0,i.jsx)(s.em,{children:"whenever you think the CSS is getting complex or it would not be easy to understand its intent."})]}),"\n",(0,i.jsxs)(s.li,{children:["Use !important proactively. ",(0,i.jsx)(s.em,{children:"!important is a very useful tool when used proactively to make a state or a very specific rule on a tightly-scoped selector stronger. It is however to be avoided at all costs as an easy solution to specificity issues, reactively."})]}),"\n"]}),"\n",(0,i.jsxs)(s.p,{children:["(Direct) child selectors can sometimes be useful. Please remember that the key selector to determine performance is the rightmost one. i.e. ",(0,i.jsx)(s.code,{children:"div > #example"})," is A LOT more efficient than ",(0,i.jsx)(s.code,{children:"#example > div"})," although it may appear otherwise at first glance. Browsers parse multi part selectors from the right. See ",(0,i.jsx)(s.a,{href:"http://csswizardry.com/2011/09/writing-efficient-css-selectors/",children:"CSS Wizardry"})," for more details."]})]})}function u(e={}){const{wrapper:s}={...(0,o.R)(),...e.components};return s?(0,i.jsx)(s,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},28453:(e,s,t)=>{t.d(s,{R:()=>r,x:()=>l});var n=t(96540);const i={},o=n.createContext(i);function r(e){const s=n.useContext(o);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function l(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),n.createElement(o.Provider,{value:s},e.children)}}}]);