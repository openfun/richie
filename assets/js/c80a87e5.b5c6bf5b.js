"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[17078],{27483:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>o,contentTitle:()=>l,default:()=>h,frontMatter:()=>r,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"native-installation","title":"Installing Richie on your machine","description":"This document aims to list all needed steps to have a working Richie","source":"@site/versioned_docs/version-2.21.0/native-installation.md","sourceDirName":".","slug":"/native-installation","permalink":"/docs/2.21.0/native-installation","draft":false,"unlisted":false,"tags":[],"version":"2.21.0","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1679473023000,"frontMatter":{"id":"native-installation","title":"Installing Richie on your machine","sidebar_label":"Native installation"},"sidebar":"docs","previous":{"title":"Docker development","permalink":"/docs/2.21.0/docker-development"},"next":{"title":"Contributing guide","permalink":"/docs/2.21.0/contributing-guide"}}');var i=t(74848),a=t(28453);const r={id:"native-installation",title:"Installing Richie on your machine",sidebar_label:"Native installation"},l=void 0,o={},d=[{value:"Installing a fresh server",id:"installing-a-fresh-server",level:2},{value:"Version",id:"version",level:3},{value:"System update",id:"system-update",level:3},{value:"Database part",id:"database-part",level:2},{value:"Elasticsearch",id:"elasticsearch",level:2},{value:"Ubuntu",id:"ubuntu",level:3},{value:"OS X",id:"os-x",level:3},{value:"Application part",id:"application-part",level:2},{value:"Python and other requirements",id:"python-and-other-requirements",level:3},{value:"The virtualenv",id:"the-virtualenv",level:3},{value:"Frontend build",id:"frontend-build",level:3},{value:"Run server",id:"run-server",level:3}];function c(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["This document aims to list all needed steps to have a working ",(0,i.jsx)(n.code,{children:"Richie"}),"\ninstallation on your laptop."]}),"\n",(0,i.jsxs)(n.p,{children:["A better approach is to use ",(0,i.jsx)(n.a,{href:"https://docs.docker.com",children:(0,i.jsx)(n.code,{children:"Docker"})})," as explained in\nour guide for ",(0,i.jsx)(n.a,{href:"/docs/2.21.0/installation",children:"container-native installation"})," instructions."]}),"\n",(0,i.jsx)(n.h2,{id:"installing-a-fresh-server",children:"Installing a fresh server"}),"\n",(0,i.jsx)(n.h3,{id:"version",children:"Version"}),"\n",(0,i.jsxs)(n.p,{children:["You need a ",(0,i.jsx)(n.code,{children:"Ubuntu 18.04 Bionic Beaver"})," (the latest LTS version) fresh\ninstallation."]}),"\n",(0,i.jsxs)(n.p,{children:["If you are using another operating system or distribution, you can use\n",(0,i.jsx)(n.a,{href:"https://docs.vagrantup.com/v2/getting-started/index.html",children:(0,i.jsx)(n.code,{children:"Vagrant"})})," to get a\nrunning Ubuntu 18.04 server in seconds."]}),"\n",(0,i.jsx)(n.h3,{id:"system-update",children:"System update"}),"\n",(0,i.jsx)(n.p,{children:"Be sure to have fresh packages on the server (kernel, libc, ssl patches...):\npost"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:"sudo apt-get -y update\nsudo apt-get -y dist-upgrade\n"})}),"\n",(0,i.jsx)(n.h2,{id:"database-part",children:"Database part"}),"\n",(0,i.jsxs)(n.p,{children:["You must first install ",(0,i.jsx)(n.code,{children:"postgresql"}),"."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:"// On Linux\nsudo apt-get -y install postgresql\n\n// On OS X\nbrew install postgresql@10\nbrew services start postgresql@10\n// don't forget to add your new postgres install to the $PATH\n"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"Postgresql"})," is now running."]}),"\n",(0,i.jsxs)(n.p,{children:["Then you can create the database owner and the database itself, using the\n",(0,i.jsx)(n.code,{children:"postgres"})," user:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:"sudo -u postgres -i // skip this on OS X as the default install will use your local user\ncreateuser fun -sP\n"})}),"\n",(0,i.jsx)(n.p,{children:"Note: we created the user as a superuser. This should only be done in dev/test\nenvironments."}),"\n",(0,i.jsx)(n.p,{children:"Now, create the database with this user:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:"createdb richie -O fun -W\nexit\n"})}),"\n",(0,i.jsx)(n.h2,{id:"elasticsearch",children:"Elasticsearch"}),"\n",(0,i.jsx)(n.h3,{id:"ubuntu",children:"Ubuntu"}),"\n",(0,i.jsx)(n.p,{children:"Download and install the Public Signing Key"}),"\n",(0,i.jsxs)(n.p,{children:["$ wget -qO - ",(0,i.jsx)(n.a,{href:"https://artifacts.elastic.co/GPG-KEY-elasticsearch",children:"https://artifacts.elastic.co/GPG-KEY-elasticsearch"})," | sudo apt-key add -"]}),"\n",(0,i.jsx)(n.p,{children:"You may need to install the apt-transport-https package on Debian before\nproceeding:"}),"\n",(0,i.jsx)(n.p,{children:"$ sudo apt-get install apt-transport-https"}),"\n",(0,i.jsx)(n.p,{children:"Save the repository definition to /etc/apt/sources.list.d/elastic-6.3.1.list:"}),"\n",(0,i.jsxs)(n.p,{children:['$ echo "deb ',(0,i.jsx)(n.a,{href:"https://artifacts.elastic.co/packages/6.3.1/apt",children:"https://artifacts.elastic.co/packages/6.3.1/apt"}),' stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.3.1.list']}),"\n",(0,i.jsx)(n.p,{children:"Update repository and install"}),"\n",(0,i.jsx)(n.p,{children:"$ sudo apt-get update\n$ sudo apt-get install elasticsearch\n$ sudo /etc/init.d/elasticsearch start"}),"\n",(0,i.jsx)(n.h3,{id:"os-x",children:"OS X"}),"\n",(0,i.jsx)(n.p,{children:"$ brew install elasticsearch"}),"\n",(0,i.jsx)(n.h2,{id:"application-part",children:"Application part"}),"\n",(0,i.jsx)(n.h3,{id:"python-and-other-requirements",children:"Python and other requirements"}),"\n",(0,i.jsxs)(n.p,{children:["We use ",(0,i.jsx)(n.code,{children:"Python 3.6"})," which is the one installed by default in ",(0,i.jsx)(n.code,{children:"Ubuntu 18.04"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["You can install it on OS X using the following commands. Make sure to always run\n",(0,i.jsx)(n.code,{children:"python3"})," instead of ",(0,i.jsx)(n.code,{children:"python"})," and ",(0,i.jsx)(n.code,{children:"pip3"})," instead of ",(0,i.jsx)(n.code,{children:"pip"})," to ensure the correct\nversion of Python (your homebrew install of 3) is used."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"brew install python3\nbrew postinstall python3\n"})}),"\n",(0,i.jsx)(n.h3,{id:"the-virtualenv",children:"The virtualenv"}),"\n",(0,i.jsxs)(n.p,{children:["Place yourself in the application directory ",(0,i.jsx)(n.code,{children:"app"}),":"]}),"\n",(0,i.jsx)(n.p,{children:"cd app"}),"\n",(0,i.jsx)(n.p,{children:"We choose to run our application in a virtual environment."}),"\n",(0,i.jsxs)(n.p,{children:["For this, we'll install ",(0,i.jsx)(n.code,{children:"virtualenvwrapper"})," and add an environment:"]}),"\n",(0,i.jsx)(n.p,{children:"pip install virtualenvwrapper"}),"\n",(0,i.jsx)(n.p,{children:"You can open a new shell to activate the virtualenvwrapper commands, or simply\ndo:"}),"\n",(0,i.jsx)(n.p,{children:"source $(which virtualenvwrapper.sh)"}),"\n",(0,i.jsxs)(n.p,{children:["Then create the virtual environment for ",(0,i.jsx)(n.code,{children:"richie"}),":"]}),"\n",(0,i.jsx)(n.p,{children:"mkvirtualenv richie --no-site-packages --python=python3"}),"\n",(0,i.jsx)(n.p,{children:"The virtualenv should now be activated and you can install the Python\ndependencies for development:"}),"\n",(0,i.jsx)(n.p,{children:"pip install -e .[dev]"}),"\n",(0,i.jsx)(n.p,{children:'The "dev.txt" requirement file installs packages specific to a dev environment\nand should not be used in production.'}),"\n",(0,i.jsx)(n.h3,{id:"frontend-build",children:"Frontend build"}),"\n",(0,i.jsx)(n.p,{children:"This project is a hybrid that uses both Django generated pages and frontend JS\ncode. As such, it includes a frontend build process that comes in two parts: JS\n& CSS."}),"\n",(0,i.jsxs)(n.p,{children:["We need NPM to install the dependencies and run the build, which depends on a\nversion of Nodejs specified in ",(0,i.jsx)(n.code,{children:".nvmrc"}),". See ",(0,i.jsx)(n.a,{href:"https://github.com/creationix/nvm",children:"the\nrepo"})," for instructions on how to install NVM.\nTo take advantage of ",(0,i.jsx)(n.code,{children:".nvmrc"}),", run this in the context of the repository:"]}),"\n",(0,i.jsx)(n.p,{children:"nvm install\nnvm use"}),"\n",(0,i.jsxs)(n.p,{children:["As a prerequisite to running the frontend build for either JS or CSS, you'll\nneed to ",(0,i.jsx)(n.a,{href:"https://yarnpkg.com/lang/en/docs/install/",children:"install yarn"})," and download\ndependencies ",(0,i.jsx)(n.em,{children:"via"}),":"]}),"\n",(0,i.jsx)(n.p,{children:"yarn install"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"JS build"}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"npm run build\n"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"CSS build"}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"This will compile all our SCSS files into one bundle and put it in the static\nfolder we're serving."}),"\n",(0,i.jsx)(n.p,{children:"npm run sass"}),"\n",(0,i.jsx)(n.h3,{id:"run-server",children:"Run server"}),"\n",(0,i.jsx)(n.p,{children:"Make sure your database is up-to-date before running the application the first\ntime and after each modification to your models:"}),"\n",(0,i.jsx)(n.p,{children:"python sandbox/manage.py migrate"}),"\n",(0,i.jsx)(n.p,{children:"You can create a superuser account:"}),"\n",(0,i.jsx)(n.p,{children:"python sandbox/manage.py createsuperuser"}),"\n",(0,i.jsx)(n.p,{children:"Run the tests"}),"\n",(0,i.jsx)(n.p,{children:"python sandbox/manage.py test"}),"\n",(0,i.jsxs)(n.p,{children:["You should now be able to start Django and view the site at\n",(0,i.jsx)(n.a,{href:"http://localhost:8000",children:"localhost:8000"})]}),"\n",(0,i.jsx)(n.p,{children:"python sandbox/manage.py runserver"})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},28453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>l});var s=t(96540);const i={},a=s.createContext(i);function r(e){const n=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),s.createElement(a.Provider,{value:n},e.children)}}}]);