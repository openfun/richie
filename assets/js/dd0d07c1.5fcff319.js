"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[99532],{26126:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"django-react-interop","title":"Connecting React components with Django","description":"richie is a hybrid app, that relies on both HTML pages generated by the backend (Django/DjangoCMS) based on templates, and React components rendered on the frontend for parts of these HTML pages.","source":"@site/versioned_docs/version-2.24.1/django-react-interop.md","sourceDirName":".","slug":"/django-react-interop","permalink":"/docs/2.24.1/django-react-interop","draft":false,"unlisted":false,"tags":[],"version":"2.24.1","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1699548651000,"frontMatter":{"id":"django-react-interop","title":"Connecting React components with Django","sidebar_label":"Django & React"},"sidebar":"docs","previous":{"title":"Search filters customization","permalink":"/docs/2.24.1/filters-customization"},"next":{"title":"Building the frontend","permalink":"/docs/2.24.1/building-the-frontend"}}');var i=t(74848),o=t(28453);const r={id:"django-react-interop",title:"Connecting React components with Django",sidebar_label:"Django & React"},c=void 0,a={},d=[{value:"Rendering components",id:"rendering-components",level:2},{value:"Example",id:"example",level:3},{value:"Passing properties to components",id:"passing-properties-to-components",level:2},{value:"Example",id:"example-1",level:3},{value:"Built-in components",id:"built-in-components",level:2},{value:"&lt;RootSearchSuggestField /&gt;",id:"rootsearchsuggestfield-",level:3},{value:"&lt;Search /&gt;",id:"search-",level:3},{value:"&lt;SearchSuggestField /&gt;",id:"searchsuggestfield-",level:3},{value:"&lt;UserLogin /&gt;",id:"userlogin-",level:3},{value:"Context",id:"context",level:2}];function l(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"richie"})," is a hybrid app, that relies on both HTML pages generated by the backend (Django/DjangoCMS) based on templates, and React components rendered on the frontend for parts of these HTML pages."]}),"\n",(0,i.jsx)(n.h2,{id:"rendering-components",children:"Rendering components"}),"\n",(0,i.jsx)(n.p,{children:"We needed a convention that enables us to easily mark those areas of the page that React needs to take control of, and to tell React which component to load there."}),"\n",(0,i.jsxs)(n.p,{children:["We decided to use a specific CSS class name along with its modifiers. We reserve the ",(0,i.jsx)(n.code,{children:"richie-react"})," class and its modified children for this purpose."]}),"\n",(0,i.jsxs)(n.p,{children:["Additionally, components including internationalized data or strings need to know which locale to use. They will pick up the locale specified through the ",(0,i.jsx)(n.code,{children:"lang"})," attribute of the ",(0,i.jsx)(n.code,{children:"<html>"})," element, which is a requirement to have an accessible page anyway."]}),"\n",(0,i.jsx)(n.p,{children:"They use the BCP47/RFC5646 format."}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-html",children:'<html lang="en-US">\n'})}),"\n",(0,i.jsx)(n.h3,{id:"example",children:"Example"}),"\n",(0,i.jsxs)(n.p,{children:["Here is how we would call a ",(0,i.jsx)(n.code,{children:"<FeaturedCourses />"})," component from a template, a plugin or a snippet:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-html",children:'<div\n  class="richie-react richie-react--featured-courses"\n></div>\n'})}),"\n",(0,i.jsx)(n.p,{children:"When our JS is loaded, it will recognize this as an element it must take over, and render the FeaturedCourses component in this element."}),"\n",(0,i.jsx)(n.h2,{id:"passing-properties-to-components",children:"Passing properties to components"}),"\n",(0,i.jsx)(n.p,{children:'Some of Richie\'s React components, and some of those you might want to write, require arguments or "props" to be passed to them. We could work around that by adding API routes to fetch these props, but that would add complexity and reduce performance.'}),"\n",(0,i.jsx)(n.p,{children:"Instead, we decided to normalize a simpler way for components in Richie to accept input from the Django template that is adding them to the DOM."}),"\n",(0,i.jsxs)(n.p,{children:["We can add a ",(0,i.jsx)(n.code,{children:"data-props"})," attribute on the element with the ",(0,i.jsx)(n.code,{children:"richie-react"})," class and write a JSON object as the value for this attribute. Each key-value pair in this object will be passed as a ",(0,i.jsx)(n.code,{children:"propName={propValue}"})," to the React component."]}),"\n",(0,i.jsx)(n.h3,{id:"example-1",children:"Example"}),"\n",(0,i.jsxs)(n.p,{children:["Here is how we would pass a ",(0,i.jsx)(n.code,{children:'categories={[ "sociology", "anthropology" ]}'})," prop to our ",(0,i.jsx)(n.code,{children:"<FeaturedCourses />"})," component:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-html",children:'<div\n  class="richie-react richie-react--featured-courses"\n  data-props=\'{"categories": ["sociology", "anthropology"]}\'\n></div>\n'})}),"\n",(0,i.jsxs)(n.p,{children:["When the component is rendered, it will be passed a ",(0,i.jsx)(n.code,{children:"categories"})," prop with the relevant categories."]}),"\n",(0,i.jsx)(n.h2,{id:"built-in-components",children:"Built-in components"}),"\n",(0,i.jsx)(n.p,{children:"Here are the React component that Richie comes with and uses out of the box."}),"\n",(0,i.jsx)(n.h3,{id:"rootsearchsuggestfield-",children:"<RootSearchSuggestField />"}),"\n",(0,i.jsxs)(n.p,{children:["Renders a course search bar, like the one that appears in the default ",(0,i.jsx)(n.code,{children:"Search"})," page."]}),"\n",(0,i.jsxs)(n.p,{children:["Interactions will send the user to the ",(0,i.jsx)(n.code,{children:"courseSearchPageUrl"})," url passed in the props, including the selected filter and/or search terms."]}),"\n",(0,i.jsx)(n.p,{children:"It also autocompletes user input with course names and allows users to go directly to the course page if they select a course name among the selected results."}),"\n",(0,i.jsx)(n.p,{children:"Props:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"courseSearchPageUrl"})," [required] \u2014 URL for the course search page users should be sent to when they select a suggestion that is not a course, or launch a search with text terms."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"context"})," [required] \u2014 see ",(0,i.jsx)(n.a,{href:"#context",children:"context"}),"."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"search-",children:"<Search />"}),"\n",(0,i.jsxs)(n.p,{children:["Renders the full-page course search engine interface, including the search results, and filters pane, but not the suggest field (which can be added separately with ",(0,i.jsx)(n.code,{children:"<SearchSuggestField />"}),") nor the page title."]}),"\n",(0,i.jsxs)(n.p,{children:["NB: the ",(0,i.jsx)(n.code,{children:"Search"})," Django template basically renders just this page. If you need this, use it instead. It is included here for completeness' sake."]}),"\n",(0,i.jsx)(n.p,{children:"Props:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"context"})," [required] \u2014 see ",(0,i.jsx)(n.a,{href:"#context",children:"context"}),"."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"searchsuggestfield-",children:"<SearchSuggestField />"}),"\n",(0,i.jsxs)(n.p,{children:["Renders the course search bar that interacts directly with ",(0,i.jsx)(n.code,{children:"<Search />"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["It automatically communicates with ",(0,i.jsx)(n.code,{children:"<Search />"})," through browser history APIs and a shared React provider. This one, unlike ",(0,i.jsx)(n.code,{children:"<RootSearchSuggestField />"}),", is meant to be used in combination with ",(0,i.jsx)(n.code,{children:"<Search />"})," (on the same page)."]}),"\n",(0,i.jsx)(n.p,{children:"Props:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"context"})," [required] \u2014 see ",(0,i.jsx)(n.a,{href:"#context",children:"context"}),"."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"userlogin-",children:"<UserLogin />"}),"\n",(0,i.jsxs)(n.p,{children:["Renders a component that uses the ",(0,i.jsx)(n.code,{children:"/users/whoami"})," endpoint to determine if the user is logged in and show them the appropriate interface: Signup/Login buttons or their name along with a Logout button."]}),"\n",(0,i.jsx)(n.p,{children:"Props:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"loginUrl"}),' [required] \u2014 the URL where the user is sent when they click on "Log in";']}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"logoutUrl"})," [required] \u2014 a link that logs the user out and redirects them (can be the standard django logout URL);"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"signupUrl"}),' [required] \u2014 the URL where the user is sent when they click on "Sign up".']}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"context",children:"Context"}),"\n",(0,i.jsxs)(n.p,{children:["All built-in components for Richie accept a ",(0,i.jsx)(n.code,{children:"context"})," prop, that may be required or optional, depending on the component."]}),"\n",(0,i.jsx)(n.p,{children:"It is used to pass app-wide contextual information pertaining to the current instance, deployment or theme of Richie."}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-js",children:'{\n    assets: {\n        // SVG sprite used throughout Richie\n        icons: "/path/to/icons/sprite.svg"\n    }\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"Note that it might be expanded in further versions of Richie."})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},28453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>c});var s=t(96540);const i={},o=s.createContext(i);function r(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);