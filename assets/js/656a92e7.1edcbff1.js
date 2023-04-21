"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[23504],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>h});var r=n(67294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=r.createContext({}),c=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},p=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),p=c(n),h=i,f=p["".concat(s,".").concat(h)]||p[h]||d[h]||o;return n?r.createElement(f,a(a({ref:t},u),{},{components:n})):r.createElement(f,a({ref:t},u))}));function h(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=p;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:i,a[1]=l;for(var c=2;c<o;c++)a[c]=n[c];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}p.displayName="MDXCreateElement"},45571:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>u,contentTitle:()=>s,default:()=>h,frontMatter:()=>l,metadata:()=>c,toc:()=>d});var r=n(83117),i=n(80102),o=(n(67294),n(3905)),a=["components"],l={id:"building-the-frontend",title:"Building Richie's frontend in your own project",sidebar_label:"Building the frontend"},s=void 0,c={unversionedId:"building-the-frontend",id:"version-2.21.1/building-the-frontend",title:"Building Richie's frontend in your own project",description:"Richie offers plenty of opportunities to customize the way it works and make it suit the needs of your own project. Most of these go through Django settings.",source:"@site/versioned_docs/version-2.21.1/building-the-frontend.md",sourceDirName:".",slug:"/building-the-frontend",permalink:"/docs/2.21.1/building-the-frontend",draft:!1,tags:[],version:"2.21.1",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1680624606,formattedLastUpdatedAt:"Apr 4, 2023",frontMatter:{id:"building-the-frontend",title:"Building Richie's frontend in your own project",sidebar_label:"Building the frontend"},sidebar:"docs",previous:{title:"Django & React",permalink:"/docs/2.21.1/django-react-interop"},next:{title:"Frontend overrides",permalink:"/docs/2.21.1/frontend-overrides"}},u={},d=[{value:"Installing <code>richie-education</code>",id:"installing-richie-education",level:2},{value:"Building the Javascript bundle",id:"building-the-javascript-bundle",level:2},{value:"Building the CSS",id:"building-the-css",level:2}],p={toc:d};function h(e){var t=e.components,n=(0,i.Z)(e,a);return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"Richie offers plenty of opportunities to customize the way it works and make it suit the needs of your own project. Most of these go through Django settings."),(0,o.kt)("p",null,"Part of Richie is a React frontend however. If you want to change how it works in ways that cannot be changed from the Django settings, you will need to build your own frontend."),(0,o.kt)("h2",{id:"installing-richie-education"},"Installing ",(0,o.kt)("inlineCode",{parentName:"h2"},"richie-education")),(0,o.kt)("p",null,"If you have not already, you should create a directory for the frontend in your project. We recommend you mirror Richie's file structure so it's easier to keep track of the changes you make."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"mkdir -p src/frontend\n")),(0,o.kt)("p",null,"Then, you need to bootstrap your own frontend project in this new directory."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"cd src/frontend\nyarn init\n")),(0,o.kt)("p",null,"With each version of Richie, we build and publish an ",(0,o.kt)("inlineCode",{parentName:"p"},"NPM")," package to enable Richie users to build their own Javascript and CSS. You're now ready to install it."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"yarn add richie-education\n")),(0,o.kt)("p",null,"In your ",(0,o.kt)("inlineCode",{parentName:"p"},"package.json")," file, you should see it in the list of dependencies. Also, there's a ",(0,o.kt)("inlineCode",{parentName:"p"},"node_modules")," directory where the package and its dependencies are actually installed."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-json"},'"dependencies": {\n    "richie-education": "1.12.0"\n},\n')),(0,o.kt)("h2",{id:"building-the-javascript-bundle"},"Building the Javascript bundle"),(0,o.kt)("p",null,"You are now ready to run your own frontend build. We'll just be using webpack directly."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"yarn webpack --config node_modules/richie-education/webpack.config.js --output-path ./build --richie-dependent-build\n")),(0,o.kt)("p",null,"Here is everything that is happening:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"yarn webpack")," \u2014 run the webpack CLI;"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"--config node_modules/richie-education/webpack.config.js")," \u2014 point webpack to ",(0,o.kt)("inlineCode",{parentName:"li"},"richie-education"),"'s webpack config file;"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"--output-path ./build")," \u2014 make sure we get our output where we need it to be;"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"--richie-dependent-build")," \u2014 enable some affordances with import paths. We pre-configured Richie's webpack to be able to run it from a dependent project.")),(0,o.kt)("p",null,"You can now run your build to change frontend settings or override frontend components with your own."),(0,o.kt)("h2",{id:"building-the-css"},"Building the CSS"),(0,o.kt)("p",null,"If you want to change styles in Richie, or add new styles for components & templates you develop yourself, you can run the SASS/CSS build yourself."),(0,o.kt)("p",null,"Start by creating your own ",(0,o.kt)("inlineCode",{parentName:"p"},"main")," file. The ",(0,o.kt)("inlineCode",{parentName:"p"},"_")," underscore at the beginning is there to prevent sass from auto-compiling the file."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"mkdir -p src/frontend/scss\ntouch src/frontend/scss/_mains.scss\n")),(0,o.kt)("p",null,"Start by importing Richie's main scss file. If you prefer, you can also directly import any files you want to include \u2014 in effect re-doing Richie's ",(0,o.kt)("inlineCode",{parentName:"p"},"_main.scss")," on your own."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-sass"},'@import "richie-education/scss/main";\n')),(0,o.kt)("p",null,"You are now ready to run the CSS build:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"cd src/frontend\nyarn build-sass\n")),(0,o.kt)("p",null,"This gives you one output CSS file that you can put in the static files directory of your project and use to override Richie's style or add your own parts."))}h.isMDXComponent=!0}}]);