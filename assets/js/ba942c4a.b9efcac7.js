"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[62047],{99009:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>l,contentTitle:()=>a,default:()=>h,frontMatter:()=>o,metadata:()=>c,toc:()=>r});var t=i(85893),s=i(11151);const o={id:"web-analytics",title:"Add web analytics to your site",sidebar_label:"Web Analytics"},a=void 0,c={id:"web-analytics",title:"Add web analytics to your site",description:"Richie has native support to Google Analytics and Google Tag Manager Web Analytics solutions.",source:"@site/versioned_docs/version-2.17.0/web-analytics.md",sourceDirName:".",slug:"/web-analytics",permalink:"/docs/2.17.0/web-analytics",draft:!1,unlisted:!1,tags:[],version:"2.17.0",lastUpdatedBy:"jbpenrath",lastUpdatedAt:1666962873,formattedLastUpdatedAt:"Oct 28, 2022",frontMatter:{id:"web-analytics",title:"Add web analytics to your site",sidebar_label:"Web Analytics"},sidebar:"docs",previous:{title:"LMS connection",permalink:"/docs/2.17.0/lms-connection"},next:{title:"Installation",permalink:"/docs/2.17.0/installation"}},l={},r=[{value:"Google Analytics",id:"google-analytics",level:2},{value:"Google Tag Manager",id:"google-tag-manager",level:2},{value:"Location of the web analytics javascript",id:"location-of-the-web-analytics-javascript",level:2},{value:"Add a new Web Analytics solution",id:"add-a-new-web-analytics-solution",level:2}];function d(e){const n={a:"a",code:"code",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:["Richie has native support to ",(0,t.jsx)(n.a,{href:"#google-analytics",children:"Google Analytics"})," and ",(0,t.jsx)(n.a,{href:"#google-tag-manager",children:"Google Tag Manager"})," Web Analytics solutions.\nThe purpose of this file is to explain how you can enable one of the supported Web Analytics providers\nand how you can extend Richie with an alternative solution."]}),"\n",(0,t.jsx)(n.h2,{id:"google-analytics",children:"Google Analytics"}),"\n",(0,t.jsxs)(n.p,{children:["Next, it is described how you can configure the ",(0,t.jsx)(n.strong,{children:"Google Analytics"})," on your Richie site."]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Add the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_ID"})," setting, with your Google Analytics tracking id code."]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"The current Google Analytics implementation also includes custom dimensions. Those dimensions permit you to create further analyses on Google Analytics or even use them to create custom reports.\nCustom dimensions with a value as example:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Organizations codes - ",(0,t.jsx)(n.code,{children:"UNIV_LISBON | UNIV_PORTO"})]}),"\n",(0,t.jsxs)(n.li,{children:["Course code - ",(0,t.jsx)(n.code,{children:"COURSE_XPTO"})]}),"\n",(0,t.jsxs)(n.li,{children:["Course runs titles - ",(0,t.jsx)(n.code,{children:"Summer edition | Winter edition"})]}),"\n",(0,t.jsxs)(n.li,{children:["Course runs resource links - ",(0,t.jsx)(n.code,{children:"http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/info"})]}),"\n",(0,t.jsxs)(n.li,{children:["Page title - ",(0,t.jsx)(n.code,{children:"Introduction to Programming"})]}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"google-tag-manager",children:"Google Tag Manager"}),"\n",(0,t.jsxs)(n.p,{children:["Next, it is described how you can configure the ",(0,t.jsx)(n.strong,{children:"Google Tag Manager"})," on your Richie site."]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Add the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_ID"})," setting, with your Google Tag Manager tracking id code."]}),"\n",(0,t.jsxs)(n.li,{children:["Add the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_PROVIDER"})," setting with the ",(0,t.jsx)(n.code,{children:"google_tag_manager"})," value."]}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["The current Google Tag Manager implementation also defines a custom dimensions like the ",(0,t.jsx)(n.a,{href:"#google-analytics",children:"Google Analytics"}),"."]}),"\n",(0,t.jsx)(n.h2,{id:"location-of-the-web-analytics-javascript",children:"Location of the web analytics javascript"}),"\n",(0,t.jsxs)(n.p,{children:["Use the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_LOCATION"})," settings to decide where do you want to put the Javascript code. Use ",(0,t.jsx)(n.code,{children:"head"})," (",(0,t.jsx)(n.strong,{children:"default"})," value), to put the Javascript on HTML header, or ",(0,t.jsx)(n.code,{children:"footer"}),", to put the Javascript code to the bottom of the body."]}),"\n",(0,t.jsx)(n.h2,{id:"add-a-new-web-analytics-solution",children:"Add a new Web Analytics solution"}),"\n",(0,t.jsx)(n.p,{children:"In this section it's described how you can add support to a different Web Analytics solution."}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["override the ",(0,t.jsx)(n.code,{children:"richie/web_analytics.html"})," template"]}),"\n",(0,t.jsxs)(n.li,{children:["define the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_ID"})," setting with your tracking identification"]}),"\n",(0,t.jsxs)(n.li,{children:["define the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_PROVIDER"})," setting with a value that represents your solution, eg. ",(0,t.jsx)(n.code,{children:"my-custom-web-analytics-software"})]}),"\n",(0,t.jsxs)(n.li,{children:["optionally change ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS_LOCATION"})," setting with ",(0,t.jsx)(n.code,{children:"head"})," (default) or ",(0,t.jsx)(n.code,{children:"footer"})," value"]}),"\n"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Example of a ",(0,t.jsx)(n.code,{children:"richie/web_analytics.html"})," file customization that prints to the browser console log the dimension keys and values:"]}),"\n"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-javascript",children:"<script type=\"text/javascript\">\n    {% for dimension_key, dimension_value_list in WEB_ANALYTICS.DIMENSIONS.items %}\n        console.log(\"dimension: index '{{forloop.counter}}' with key '{{ dimension_key }}' with value '{{ dimension_value_list|join:\" | \" }}'\");\n    {% endfor %}\n<\/script>\n"})}),"\n",(0,t.jsx)(n.p,{children:"Output:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"dimension: index '1' with key 'organizations_codes' with value 'COMPATIBLE-EVEN-KEELED-UTILIZATION-19 | FOCUSED-NEXT-GENERATION-FUNCTIONALITIES-22 | UNIVERSAL-MODULAR-LOCAL-AREA-NETWORK-23'\ndimension: index '2' with key 'course_code' with value '00017'\ndimension: index '3' with key 'course_runs_titles' with value 'Run 0'\ndimension: index '4' with key 'course_runs_resource_links' with value ''\ndimension: index '5' with key 'page_title' with value 'Business-focused zero-defect application'\n"})}),"\n",(0,t.jsxs)(n.p,{children:["But you can also contribute to Richie by creating a pull request to add support for a different web analytics solution. In this last case, you have to edit directly the ",(0,t.jsx)(n.code,{children:"richie/web_analytics.html"})," template."]}),"\n",(0,t.jsxs)(n.p,{children:["Example of an override of the ",(0,t.jsx)(n.code,{children:"richie/web_analytics.html"})," file:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-html",children:'{% block web_analytics %}\n    {% if WEB_ANALYTICS_ID %} \n        {% if WEB_ANALYTICS_PROVIDER == "my_custom_web_analytics_software" %}\n            <script type="text/javascript" src="{% static \'myapp/js/custom_web_analytics_software.js\' %}">\n            <script type="text/javascript">\n                // javascript code that startups the custom web analytics software\n            <\/script>\n        {% endif %}\n    {% endif %}\n{% endblock web_analytics %}\n'})}),"\n",(0,t.jsxs)(n.p,{children:["The web analytics dimensions are being added to the django context using the ",(0,t.jsx)(n.code,{children:"WEB_ANALYTICS.DIMENSIONS"})," dictionary. Because each dimension value could have multiple values, then each dictionary value is a list. Web analytics dimensions dictionary keys:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"organizations_codes"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"course_code"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"course_runs_titles"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"course_runs_resource_links"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"page_title"})}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["Example, if you only need the organization codes on your custom ",(0,t.jsx)(n.code,{children:"richie/web_analytics.html"})," file:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-javascript",children:'<script type="text/javascript">\n    console.log("organization codes: \'{{ WEB_ANALYTICS.DIMENSIONS.organizations_codes |join:" | " }}");\n<\/script>\n'})}),"\n",(0,t.jsxs)(n.p,{children:["The frontend code also sends ",(0,t.jsx)(n.strong,{children:"events"})," to the web analytics provider.\nRichie sends events when the user is enrolled on a course run.\nTo support different providers, you need to create a similar file\nof ",(0,t.jsx)(n.code,{children:"src/frontend/js/utils/api/web-analytics/google_analytics.ts"})," and change the ",(0,t.jsx)(n.code,{children:"src/frontend/js/utils/api/web-analytics/index.ts"})," file to include that newer provider."]})]})}function h(e={}){const{wrapper:n}={...(0,s.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},11151:(e,n,i)=>{i.d(n,{Z:()=>c,a:()=>a});var t=i(67294);const s={},o=t.createContext(s);function a(e){const n=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),t.createElement(o.Provider,{value:n},e.children)}}}]);