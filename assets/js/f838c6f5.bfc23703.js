"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[36252],{79670:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>l,contentTitle:()=>s,default:()=>h,frontMatter:()=>t,metadata:()=>a,toc:()=>d});var i=o(74848),r=o(28453);const t={id:"frontend-overrides",title:"Overriding frontend components",sidebar_label:"Frontend overrides"},s=void 0,a={id:"frontend-overrides",title:"Overriding frontend components",description:"Once you are able to build the frontend in your project (see previous section), you can override some parts of the frontend with a drop-in replacement you built yourself.",source:"@site/versioned_docs/version-2.18.0/frontend-overrides.md",sourceDirName:".",slug:"/frontend-overrides",permalink:"/docs/2.18.0/frontend-overrides",draft:!1,unlisted:!1,tags:[],version:"2.18.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1673544673e3,frontMatter:{id:"frontend-overrides",title:"Overriding frontend components",sidebar_label:"Frontend overrides"},sidebar:"docs",previous:{title:"Building the frontend",permalink:"/docs/2.18.0/building-the-frontend"},next:{title:"I18n",permalink:"/docs/2.18.0/internationalization"}},l={},d=[{value:"Defining your overrides",id:"defining-your-overrides",level:2},{value:"Building a component override",id:"building-a-component-override",level:2},{value:"Override translation",id:"override-translation",level:2},{value:"Create new translation keys",id:"create-new-translation-keys",level:3},{value:"Override an existing translation key",id:"override-an-existing-translation-key",level:3}];function c(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"Once you are able to build the frontend in your project (see previous section), you can override some parts of the frontend with a drop-in replacement you built yourself."}),"\n",(0,i.jsx)(n.p,{children:"This enables you to customize Richie to your own needs in the same way you could do it with backend templates by overriding templates or blocks which do not suit your needs."}),"\n",(0,i.jsx)(n.h2,{id:"defining-your-overrides",children:"Defining your overrides"}),"\n",(0,i.jsxs)(n.p,{children:["Create a ",(0,i.jsx)(n.code,{children:"json"})," settings files somewhere in your project. You'll use it to declare the overrides for your custom Richie build."]}),"\n",(0,i.jsx)(n.p,{children:"Currently, it is only possible to override components. Richie's build is only set up to handle them."}),"\n",(0,i.jsxs)(n.p,{children:["Inside, create an object with only one key: ",(0,i.jsx)(n.code,{children:'"overrides"'}),". This is an object, whose key-value pairs is the name of a component as a key and the path to the drop-in replacement as the value."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'{\n  "overrides": {\n    "CourseGlimpse": "src/richie/components/CustomCourseGlimpse.tsx"\n  }\n}\n'})}),"\n",(0,i.jsx)(n.h2,{id:"building-a-component-override",children:"Building a component override"}),"\n",(0,i.jsx)(n.p,{children:"As overrides are supposed to be drop-in replacements, directly processed by the bundler instead of the original file, they need to expose the same API."}),"\n",(0,i.jsx)(n.p,{children:"For example, if our component to override was the following:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-tsx",children:"export interface CourseGlimpseProps {\n  course: Course;\n  context: { someProp: string };\n}\n\nexport const CourseGlimpse: React.FC<CourseGlimpseProps> = ({ course, context }) => {\n  // Whatever happens in this component\n  return <p>The glimpse</p>;\n};\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Then, your override needs to provide the same exports, explicitly a named ",(0,i.jsx)(n.code,{children:"CourseGlimpseProps"})," interface and a named ",(0,i.jsx)(n.code,{children:"CourseGlimpse"})," component."]}),"\n",(0,i.jsx)(n.p,{children:"You also need to respect the assumptions made by other components that use your overridden version, if you are not overriding a root component."}),"\n",(0,i.jsxs)(n.p,{children:["For example returning ",(0,i.jsx)(n.code,{children:"null"})," might break a layout if the original component never returned such a value, etc. You also need to make sure to avoid conflict with the parameters accepted by the original component."]}),"\n",(0,i.jsx)(n.h2,{id:"override-translation",children:"Override translation"}),"\n",(0,i.jsx)(n.p,{children:"When you create an application based on richie, you can encounter two cases about translations:"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsx)(n.li,{children:"You created or overrode a react component and created new translation keys"}),"\n",(0,i.jsx)(n.li,{children:"You just want to override a translation in an existing richie component"}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"create-new-translation-keys",children:"Create new translation keys"}),"\n",(0,i.jsx)(n.p,{children:"Once you created your new component with its translation keys, you have to extract them with the following command:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"  formatjs extract './**/*.ts*' --ignore ./node_modules --ignore './**/*.d.ts' --out-file './i18n/frontend.json --id-interpolation-pattern '[sha512:contenthash:base64:6]' --format crowdin\n"})}),"\n",(0,i.jsxs)(n.p,{children:["This command extracts all translations defined in your typescript files then generates a ",(0,i.jsx)(n.code,{children:"frontend.json"})," file in ",(0,i.jsx)(n.code,{children:"i18n/"})," directory. This file is like a pot file, this is the base to create your translations in any language you want."]}),"\n",(0,i.jsxs)(n.p,{children:["As ",(0,i.jsx)(n.code,{children:"--format"})," option indicates, this command generates a file compatible with crowdin. If you want to customize this command to fit your needs, read the ",(0,i.jsx)(n.a,{href:"https://formatjs.io/docs/tooling/cli/",children:"formatjs/cli documentation"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["Once translations keys are extracted and your local translations are ready, you need to compile these translations. In fact, the compilation process first aggregates all translation files found from provided paths then merges them with richie translations according their filename and finally generates an output formatted for ",(0,i.jsx)(n.code,{children:"react-intl"}),". Below, here is an example of a compilation command:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"  node-modules/richie-education/i18n/compile-translations.js ./i18n/locales/*.json\n"})}),"\n",(0,i.jsxs)(n.p,{children:["This command looks for all translation files in ",(0,i.jsx)(n.code,{children:"i18n/locales"})," directory then merges files found with richie translation files. You can pass several path patterns. You can also use an ",(0,i.jsx)(n.code,{children:"--ignore"})," argument to ignore a particular path."]}),"\n",(0,i.jsx)(n.h3,{id:"override-an-existing-translation-key",children:"Override an existing translation key"}),"\n",(0,i.jsxs)(n.p,{children:["As explain above, the compilation process aggregates translations files then ",(0,i.jsx)(n.strong,{children:"merges them according their filename"}),". That means if you want override for example the english translation, you just have to create a ",(0,i.jsx)(n.code,{children:"en-US.json"})," file and redefine translation keys used by Richie."]}),"\n",(0,i.jsx)(n.p,{children:"Richie uses one file per language. Currently 4 languages supported:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["English: filename is ",(0,i.jsx)(n.code,{children:"en-US.json"})]}),"\n",(0,i.jsxs)(n.li,{children:["French: filename is ",(0,i.jsx)(n.code,{children:"fr-FR.json"})]}),"\n",(0,i.jsxs)(n.li,{children:["Canadian french: filename is ",(0,i.jsx)(n.code,{children:"fr-CA.json"})]}),"\n",(0,i.jsxs)(n.li,{children:["Spanish: filename is ",(0,i.jsx)(n.code,{children:"es-ES.json"})]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["For example, richie uses the translation key ",(0,i.jsx)(n.code,{children:"components.UserLogin.logIn"})," for the Log in button. If you want to change this label for the english translation, you just have to create a translation file ",(0,i.jsx)(n.code,{children:"en-US.json"})," which redefines this translation key:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'{\n  "components.UserLogin.logIn": {\n    "description": "Overriden text for the login button.",\n    "message": "Authentication"\n  },\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"Then, for example if you put your overridden translation in i18n/overrides directory, you have to launch the compilation command below:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"  node-modules/richie-education/i18n/compile-translations.js ./i18n/overrides/*.json\n"})}),"\n",(0,i.jsxs)(n.p,{children:['In this way, "',(0,i.jsx)(n.em,{children:"Authentication"}),'" will be displayed as label for login button instead of "',(0,i.jsx)(n.em,{children:"Sign in"}),'".']})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},28453:(e,n,o)=>{o.d(n,{R:()=>s,x:()=>a});var i=o(96540);const r={},t=i.createContext(r);function s(e){const n=i.useContext(t);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),i.createElement(t.Provider,{value:n},e.children)}}}]);