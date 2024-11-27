"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[54207],{43003:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>i,metadata:()=>c,toc:()=>d});var o=s(74848),t=s(28453);const i={id:"docker-development",title:"Developing Richie with Docker",sidebar_label:"Docker development"},r=void 0,c={id:"docker-development",title:"Developing Richie with Docker",description:"Now that you have Richie up and running, you can start working with it.",source:"@site/versioned_docs/version-1.16/docker-development.md",sourceDirName:".",slug:"/docker-development",permalink:"/docs/1.16/docker-development",draft:!1,unlisted:!1,tags:[],version:"1.16",lastUpdatedBy:"Mehdi Benadda",lastUpdatedAt:1655108611e3,frontMatter:{id:"docker-development",title:"Developing Richie with Docker",sidebar_label:"Docker development"},sidebar:"docs",previous:{title:"Quick start",permalink:"/docs/1.16/discover"},next:{title:"Native installation",permalink:"/docs/1.16/native-installation"}},l={},d=[{value:"Settings",id:"settings",level:2},{value:"Front-end tools",id:"front-end-tools",level:2},{value:"Container control",id:"container-control",level:2},{value:"Debugging",id:"debugging",level:2},{value:"Using sugar scripts",id:"using-sugar-scripts",level:2},{value:"Cleanup",id:"cleanup",level:2},{value:"Troubleshooting",id:"troubleshooting",level:2},{value:"ElasticSearch service is always down",id:"elasticsearch-service-is-always-down",level:3}];function a(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(n.p,{children:["Now that you have ",(0,o.jsx)(n.code,{children:"Richie"})," up and running, you can start working with it."]}),"\n",(0,o.jsx)(n.h2,{id:"settings",children:"Settings"}),"\n",(0,o.jsxs)(n.p,{children:["Settings are defined using ",(0,o.jsx)(n.a,{href:"https://django-configurations.readthedocs.io/en/stable/",children:"Django\nConfigurations"})," for\ndifferent environments:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Development"}),": settings for development on developers' local environment,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Test"}),": settings used to run our test suite,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ContinousIntegration"}),": settings used on the continuous integration platform,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Feature"}),": settings for deployment of each developers' feature branches,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Staging"}),": settings for deployment to the staging environment,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PreProduction"}),": settings for deployment to the pre-production environment,"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Production"}),": settings for deployment to the production environment."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.code,{children:"Development"})," environment is defined as the default environment."]}),"\n",(0,o.jsx)(n.h2,{id:"front-end-tools",children:"Front-end tools"}),"\n",(0,o.jsx)(n.p,{children:"If you intend to work on the front-end development of the CMS, we also have\nsweet candies for you! \ud83e\udd13"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"# Start the Sass watcher\n$ make watch-sass\n\n# In a new terminal or session, start the TypeScript watcher\n$ make watch-ts\n"})}),"\n",(0,o.jsx)(n.h2,{id:"container-control",children:"Container control"}),"\n",(0,o.jsx)(n.p,{children:"You can stop/start/restart a container:"}),"\n",(0,o.jsx)(n.p,{children:"$ docker-compose [stop|start|restart] [app|postgresql|mysql|elasticsearch]"}),"\n",(0,o.jsx)(n.p,{children:"or stop/start/restart all containers in one command:"}),"\n",(0,o.jsx)(n.p,{children:"$ docker-compose [stop|start|restart]"}),"\n",(0,o.jsx)(n.h2,{id:"debugging",children:"Debugging"}),"\n",(0,o.jsx)(n.p,{children:"You can easily see the latest logs for a container:"}),"\n",(0,o.jsx)(n.p,{children:"$ docker-compose logs [app|postgresql|mysql|elasticsearch]"}),"\n",(0,o.jsx)(n.p,{children:"Or follow the stream of logs:"}),"\n",(0,o.jsx)(n.p,{children:"$ docker-compose logs --follow [app|postgresql|mysql|elasticsearch]"}),"\n",(0,o.jsxs)(n.p,{children:["If you need to debug a running container, you can open a Linux shell with the\n",(0,o.jsx)(n.code,{children:"docker-compose exec"})," command (we use a sugar script here, see next section):"]}),"\n",(0,o.jsx)(n.p,{children:"$ bin/exec [app|postgresql|mysql|elasticsearch] bash"}),"\n",(0,o.jsxs)(n.p,{children:["While developing on ",(0,o.jsx)(n.code,{children:"Richie"}),", you will also need to run a ",(0,o.jsx)(n.code,{children:"Django shell"})," and it\nhas to be done in the ",(0,o.jsx)(n.code,{children:"app"})," container (we use a sugar script here, see next\nsection):"]}),"\n",(0,o.jsx)(n.p,{children:"$ bin/run app python sandbox/manage.py shell"}),"\n",(0,o.jsx)(n.h2,{id:"using-sugar-scripts",children:"Using sugar scripts"}),"\n",(0,o.jsxs)(n.p,{children:["While developing using Docker, you will fall into permission issues if you mount\nthe code directory as a volume in the container. Indeed, the Docker engine will,\nby default, run the containers using the ",(0,o.jsx)(n.code,{children:"root"})," user. Any file created or\nupdated by the app container on your host, as a result of the volume mounts,\nwill be owned by the local root user. One way to solve this is to use the\n",(0,o.jsx)(n.code,{children:'--user="$(id -u)"'})," flag when calling the ",(0,o.jsx)(n.code,{children:"docker-compose run"})," or\n",(0,o.jsx)(n.code,{children:"docker-compose exec"}),' commands. By using the user flag trick, the running\ncontainer user ID will match your local user ID. But, as it\'s repetitive and\nerror-prone, we provide shortcuts that we call our "sugar scripts":']}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"bin/run"}),": is a shortcut for ",(0,o.jsx)(n.code,{children:'docker-compose run --rm --user="$(id -u)"'})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"bin/exec"}),": is a shortcut for ",(0,o.jsx)(n.code,{children:'docker-compose exec --user="$(id -u)"'})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"bin/pylint"}),": runs ",(0,o.jsx)(n.code,{children:"pylint"})," in the ",(0,o.jsx)(n.code,{children:"app"})," service using the test docker-compose\nfile"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"bin/pytest"}),": runs ",(0,o.jsx)(n.code,{children:"pytest"})," in the ",(0,o.jsx)(n.code,{children:"app"})," service using the test docker-compose\nfile"]}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"cleanup",children:"Cleanup"}),"\n",(0,o.jsx)(n.p,{children:"If you work on the Docker configuration and make repeated modifications,\nremember to periodically clean the unused docker images and containers by\nrunning:"}),"\n",(0,o.jsx)(n.p,{children:"$ docker image prune\n$ docker container prune"}),"\n",(0,o.jsx)(n.h2,{id:"troubleshooting",children:"Troubleshooting"}),"\n",(0,o.jsx)(n.h3,{id:"elasticsearch-service-is-always-down",children:"ElasticSearch service is always down"}),"\n",(0,o.jsxs)(n.p,{children:["If your ",(0,o.jsx)(n.code,{children:"elasticsearch"})," container fails at booting, checkout the logs via:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"$ docker-compose logs elasticsearch\n"})}),"\n",(0,o.jsx)(n.p,{children:"You may see entries similar to:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"[1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]\n"})}),"\n",(0,o.jsx)(n.p,{children:"In this case, increase virtual memory as follows (UNIX systems):"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"$ sudo sysctl -w vm/max_map_count=262144\n"})})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(a,{...e})}):a(e)}},28453:(e,n,s)=>{s.d(n,{R:()=>r,x:()=>c});var o=s(96540);const t={},i=o.createContext(t);function r(e){const n=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),o.createElement(i.Provider,{value:n},e.children)}}}]);