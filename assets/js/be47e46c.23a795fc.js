"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[24369],{61876:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>a,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>c,toc:()=>d});var i=s(85893),t=s(11151);const r={id:"synchronizing-course-runs",title:"Synchronizing course runs between Richie and OpenEdX",sidebar_label:"Synchronizing course runs"},o=void 0,c={id:"synchronizing-course-runs",title:"Synchronizing course runs between Richie and OpenEdX",description:"Richie can receive automatic course runs updates on a dedicated API endpoint.",source:"@site/versioned_docs/version-2.13.0/synchronizing-course-runs.md",sourceDirName:".",slug:"/synchronizing-course-runs",permalink:"/docs/2.13.0/synchronizing-course-runs",draft:!1,unlisted:!1,tags:[],version:"2.13.0",lastUpdatedBy:"Mehdi Benadda",lastUpdatedAt:1655108611,formattedLastUpdatedAt:"Jun 13, 2022",frontMatter:{id:"synchronizing-course-runs",title:"Synchronizing course runs between Richie and OpenEdX",sidebar_label:"Synchronizing course runs"}},a={},d=[{value:"Configure a shared secret",id:"configure-a-shared-secret",level:2},{value:"Configure LMS backends",id:"configure-lms-backends",level:2},{value:"Make a synchronization query",id:"make-a-synchronization-query",level:2}];function u(e){const n={a:"a",code:"code",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"Richie can receive automatic course runs updates on a dedicated API endpoint."}),"\n",(0,i.jsx)(n.h2,{id:"configure-a-shared-secret",children:"Configure a shared secret"}),"\n",(0,i.jsxs)(n.p,{children:["In order to activate the course run synchronization API endpoint, you first need to configure the\n",(0,i.jsx)(n.code,{children:"RICHIE_COURSE_RUN_SYNC_SECRETS"})," setting with one or more secrets:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-python",children:'RICHIE_COURSE_RUN_SYNC_SECRETS = ["SharedSecret", "OtherSharedSecret"]\n'})}),"\n",(0,i.jsx)(n.p,{children:"This setting collects several secrets in order to allow rotating them without any downtime. Any\nof the secrets listed in this setting can be used to sign your queries."}),"\n",(0,i.jsx)(n.p,{children:"Your secret should be shared with the LMS or distant system that needs to synchronize its course\nruns with the Richie instance. Richie will try the declared secrets one by one until it finds\none that matches the signature sent by the remote system."}),"\n",(0,i.jsx)(n.h2,{id:"configure-lms-backends",children:"Configure LMS backends"}),"\n",(0,i.jsxs)(n.p,{children:["You then need to configure the LMS handler via the ",(0,i.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," setting as explained\nin our ",(0,i.jsx)(n.a,{href:"lms-backends#configuring-the-lms-handler",children:"guide on configuring LMS backends"}),". This is\nrequired if you want Richie to create a new course run automatically and associate it with the\nright course when the resource link submitted to the course run synchronization API endpoint is\nunknown to Richie."]}),"\n",(0,i.jsxs)(n.p,{children:["Each course run can be set to react differently to a synchronization request, thanks to the\n",(0,i.jsx)(n.code,{children:"sync_mode"})," field. This field can be set to one of the following values:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"manual"}),": this course run is ignored by the course runs synchronization script. In this case,\nthe course run can only be edited manually using the DjangoCMS frontend editing."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"sync_to_draft"}),": only the draft version of this course run is synchronized. A manual\npublication is necessary for the update to be visible on the public site."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"sync_to_public"}),": the public version of this course run is updated by the synchronization\nscript. As a results, updates are directly visible on the public site without further\npublication by a staff user in Richie."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["A ",(0,i.jsx)(n.a,{href:"lms-backends#default_course_run_sync_mode",children:"DEFAULT_COURSE_RUN_SYNC_MODE parameter"})," in the\n",(0,i.jsx)(n.code,{children:"RICHIE_LMS_BACKENDS"})," setting, defines what default value is used for new course runs."]}),"\n",(0,i.jsx)(n.h2,{id:"make-a-synchronization-query",children:"Make a synchronization query"}),"\n",(0,i.jsxs)(n.p,{children:["You can refer to the ",(0,i.jsx)(n.a,{href:"api/course-run-synchronization-api",children:"documentation of the course run synchronization API"})," for details\non the query expected by this endpoint."]}),"\n",(0,i.jsxs)(n.p,{children:["We also share here our sample code to call this synchronization endpoint from OpenEdX. This code\nshould run on the ",(0,i.jsx)(n.code,{children:"post_publish"})," signal emitted by the OpenEdX ",(0,i.jsx)(n.code,{children:"cms"})," application each time a\ncourse run is modified and published."]}),"\n",(0,i.jsxs)(n.p,{children:["Or you can use the ",(0,i.jsx)(n.a,{href:"https://github.com/fccn/richie-openedx-sync",children:"Richie Open edX Synchronization"}),"\nwhich is based on the following code sample and also includes the enrollment count."]}),"\n",(0,i.jsxs)(n.p,{children:["Given a ",(0,i.jsx)(n.code,{children:"COURSE_HOOK"})," setting defined as follows in your OpenEdX instance:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-python",children:'COURSE_HOOK = {\n    "secret": "SharedSecret",\n    "url": "https://richie.example.com/api/v1.0/course-runs-sync/",\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"The code for the synchronization function in OpenEdX could look like this:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-python",children:'import hashlib\nimport hmac\nimport json\n\nfrom django.conf import settings\n\nfrom microsite_configuration import microsite\nimport requests\nfrom xmodule.modulestore.django import modulestore\n\n\ndef update_course(course_key, *args, **kwargs):\n    """Synchronize an OpenEdX course, identified by its course key, with a Richie instance."""\n    course = modulestore().get_course(course_key)\n    edxapp_domain = microsite.get_value("site_domain", settings.LMS_BASE)\n\n    data = {\n        "resource_link": "https://{:s}/courses/{!s}/info".format(\n            edxapp_domain, course_key\n        ),\n        "start": course.start and course.start.isoformat(),\n        "end": course.end and course.end.isoformat(),\n        "enrollment_start": course.enrollment_start and course.enrollment_start.isoformat(),\n        "enrollment_end": course.enrollment_end and course.enrollment_end.isoformat(),\n        "languages": [course.language or settings.LANGUAGE_CODE],\n    }\n\n    signature = hmac.new(\n        setting.COURSE_HOOK["secret"].encode("utf-8"),\n        msg=json.dumps(data).encode("utf-8"),\n        digestmod=hashlib.sha256,\n    ).hexdigest()\n\n    response = requests.post(\n        setting.COURSE_HOOK["url"],\n        json=data,\n        headers={"Authorization": "SIG-HMAC-SHA256 {:s}".format(signature)},\n    )\n'})}),"\n",(0,i.jsx)(n.p,{children:"Thanks to the signal emitted in OpenEdX, this function can then be triggered each time a course\nis modified and published:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-python",children:"from django.dispatch import receiver\nfrom xmodule.modulestore.django import SignalHandler\n\n\n@receiver(SignalHandler.course_published, dispatch_uid='update_course_on_publish')\ndef update_course_on_publish(sender, course_key, **kwargs):\n    update_course(course_key)\n"})})]})}function h(e={}){const{wrapper:n}={...(0,t.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(u,{...e})}):u(e)}},11151:(e,n,s)=>{s.d(n,{Z:()=>c,a:()=>o});var i=s(67294);const t={},r=i.createContext(t);function o(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);