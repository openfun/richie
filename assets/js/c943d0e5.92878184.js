"use strict";(self.webpackChunkrichie_education_docs=self.webpackChunkrichie_education_docs||[]).push([[24346],{12160:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>d,frontMatter:()=>a,metadata:()=>i,toc:()=>c});const i=JSON.parse('{"id":"filters-customization","title":"Customizing search filters","description":"You may want to customize the filters on the left side bar of the search page.","source":"@site/versioned_docs/version-2.28.1/filters-customization.md","sourceDirName":".","slug":"/filters-customization","permalink":"/docs/2.28.1/filters-customization","draft":false,"unlisted":false,"tags":[],"version":"2.28.1","lastUpdatedBy":"jbpenrath","lastUpdatedAt":1718960506000,"frontMatter":{"id":"filters-customization","title":"Customizing search filters","sidebar_label":"Search filters customization"},"sidebar":"docs","previous":{"title":"Start your own site","permalink":"/docs/2.28.1/cookiecutter"},"next":{"title":"Django & React","permalink":"/docs/2.28.1/django-react-interop"}}');var s=t(74848),r=t(28453);const a={id:"filters-customization",title:"Customizing search filters",sidebar_label:"Search filters customization"},o=void 0,l={},c=[{value:"Filters configuration",id:"filters-configuration",level:2},{value:"Filters presentation",id:"filters-presentation",level:2},{value:"Writing your own custom filters",id:"writing-your-own-custom-filters",level:2}];function h(e){const n={a:"a",code:"code",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:"You may want to customize the filters on the left side bar of the search page."}),"\n",(0,s.jsx)(n.p,{children:"Richie makes it easy to choose which filters you want to display among the existing filters\nand in which order. You can also configure the existing filters to change their title or the\nway they behave. Lastly, you can completely override a filter or create your own custom filter\nfrom scratch."}),"\n",(0,s.jsx)(n.h2,{id:"filters-configuration",children:"Filters configuration"}),"\n",(0,s.jsxs)(n.p,{children:["Filters must first be defined in the ",(0,s.jsx)(n.code,{children:"FILTERS_CONFIGURATION"})," setting. It is a dictionary defining\nfor each filter, a predefined ",(0,s.jsx)(n.code,{children:"class"})," in the code where the filter is implemented and the\nparameters to apply to this class when instantiating it."]}),"\n",(0,s.jsx)(n.p,{children:"Let's study a few examples of filters in the default configuration:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'FILTERS_CONFIGURATION = {\n    ...\n    "pace": {\n        "class": "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",\n        "params": {\n            "fragment_map": {\n                "self-paced": [{"bool": {"must_not": {"exists": {"field": "pace"}}}}],\n                "lt-1h": [{"range": {"pace": {"lt": 60}}}],\n                "1h-2h": [{"range": {"pace": {"gte": 60, "lte": 120}}}],\n                "gt-2h": [{"range": {"pace": {"gt": 120}}}],\n            },\n            "human_name": _("Weekly pace"),\n            "min_doc_count": 0,\n            "sorting": "conf",\n            "values": {\n                "self-paced": _("Self-paced"),\n                "lt-1h": _("Less than one hour"),\n                "1h-2h": _("One to two hours"),\n                "gt-2h": _("More than two hours"),\n            },\n        },\n    },\n    ...\n}\n'})}),"\n",(0,s.jsxs)(n.p,{children:["This filter uses the ",(0,s.jsx)(n.code,{children:"StaticChoicesFilterDefinition"})," filter definition class and allows filtering\non the ",(0,s.jsx)(n.code,{children:"pace"})," field present in the Elasticsearch index. The ",(0,s.jsx)(n.code,{children:"values"})," parameter defines 4 ranges\nand their human readable format that will appear as 4 filtering options to the user."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"fragment_map"})," parameter defines a fragment of the Elasticsearch query to apply on the ",(0,s.jsx)(n.code,{children:"pace"}),"\nfield when one of these options is selected."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"human_name"}),"parameter defines how the filter is entitled. It is defined as a lazy i18n string\nso that it can be translated."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"sorting"})," parameter determines how the facets are sorted in the left side panel of the filter:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"conf"}),": facets are sorted as defined in the ",(0,s.jsx)(n.code,{children:"values"})," configuration parameter"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"count"}),": facets are sorted according to the number of course results associated with each facet"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"name"}),": facets are sorted by their name in alphabetical order"]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"min_doc_count"})," parameter defines how many associated results a facet must have at the minimum\nbefore it is displayed as an option for the filter."]}),"\n",(0,s.jsx)(n.p,{children:"Let's study another interesting example:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'FILTERS_CONFIGURATION = {\n    ...\n    "organizations": {\n        "class": "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",\n        "params": {\n            "human_name": _("Organizations"),\n            "is_autocompletable": True,\n            "is_drilldown": False,\n            "is_searchable": True,\n            "min_doc_count": 0,\n            "reverse_id": "organizations",\n        },\n    },\n    ...\n}\n'})}),"\n",(0,s.jsxs)(n.p,{children:["This filter uses the ",(0,s.jsx)(n.code,{children:"IndexableHierarchicalFilterDefinition"})," filter definition class and allows\nfiltering on the link between course pages and other pages identified by their IDs like for\nexample here ",(0,s.jsx)(n.code,{children:"Organization"})," pages."]}),"\n",(0,s.jsxs)(n.p,{children:["In the example above, when an option is selected, results will only include the courses for which\nthe ",(0,s.jsx)(n.code,{children:"organizations"})," field in the index is including the ID of the selected organization page."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"reverse_id"})," parameter should point to a page's reverse ID (see DjangoCMS documentation) in\nthe CMS. The filter will propose a filtering option for each children organization under this\npage."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"is_autocompletable"})," field determines whether organizations should be searched and suggested\nby the autocomplete feature (organizations must have an associated index and API endpoint for\nautocompletion carrying the same name)."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"is_drilldown"})," parameter determines whether the filter is limited to one active value at a\ntime or allows multi-facetting."]}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.code,{children:"is_searchable"}),' field determines whether organizations filters should present a "more options"\nbutton in case there are more facet options in results than can be displayed (organizations must\nhave an associated API endpoint for full-text search, carrying the same name).']}),"\n",(0,s.jsx)(n.p,{children:"Lastly, let's look at nested filters which, as their name indicates, allow filtering on nested\nfields."}),"\n",(0,s.jsxs)(n.p,{children:["For example, in the course index, one of the fields is named ",(0,s.jsx)(n.code,{children:"course_runs"})," and contains a list of\nobjects in the following format:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'"course_runs": [\n    {\n        "start": "2022-09-09T09:00:00.000000",\n        "end": "2021-10-30T00:00:00.000000Z",\n        "enrollment_start": "2022-08-01T09:00:00.000000Z",\n        "enrollment_end": "2022-09-08T00:00:00.000000Z",\n        "languages": ["en", "fr"],\n    },\n    {\n        "start": "2023-03-01T09:00:00.000000",\n        "end": "2023-06-03T00:00:00.000000Z",\n        "enrollment_start": "2023-01-01T09:00:00.000000Z",\n        "enrollment_end": "2023-03-01T00:00:00.000000Z",\n        "languages": ["fr"],\n    },\n]\n'})}),"\n",(0,s.jsx)(n.p,{children:"If we want to filter courses that are available in the english language, we can thus configure the\nfollowing filter:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'FILTERS_CONFIGURATION = {\n    ...\n    "course_runs": {\n        "class": "richie.apps.search.filter_definitions.NestingWrapper",\n        "params": {\n            "filters": {\n                "languages": {\n                    "class": "richie.apps.search.filter_definitions.LanguagesFilterDefinition",\n                    "params": {\n                        "human_name": _("Languages"),\n                        # There are too many available languages to show them all, all the time.\n                        # Eg. 200 languages, 190+ of which will have 0 matching courses.\n                        "min_doc_count": 1,\n                    },\n                },\n            }\n        },\n    },\n    ...\n}\n'})}),"\n",(0,s.jsx)(n.h2,{id:"filters-presentation",children:"Filters presentation"}),"\n",(0,s.jsxs)(n.p,{children:["Which filters are displayed in the left side bar of the search page and in which order is defined\nby the ",(0,s.jsx)(n.code,{children:"RICHIE_FILTERS_PRESENTATION"})," setting."]}),"\n",(0,s.jsxs)(n.p,{children:["This setting is expecting a list of strings, which are the names of the filters as defined\nin the ",(0,s.jsx)(n.code,{children:"FILTERS_CONFIGURATION"})," setting decribed in the previous section. If it, for example,\ncontains the 3 filters presented in the previous section, we could define the following\npresentation:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'RICHIE_FILTERS_PRESENTATION = ["organizations", "languages", "pace"]\n'})}),"\n",(0,s.jsx)(n.h2,{id:"writing-your-own-custom-filters",children:"Writing your own custom filters"}),"\n",(0,s.jsxs)(n.p,{children:["You can write your own filters from scratch although we must warn you that it is not trivial\nbecause it requires a good knowledge of Elasticsearch and studying the mapping defined in the\n",(0,s.jsx)(n.a,{href:"https://github.com/openfun/richie/blob/master/src/richie/apps/search/indexers/courses.py",children:"courses indexer"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["A filter is a class deriving from ",(0,s.jsx)(n.a,{href:"https://github.com/openfun/richie/blob/master/src/richie/apps/search/filter_definitions/base.py",children:"BaseFilterDefinition"})," and defining methods to return the\ninformation to display the filter and query fragments for elasticsearch:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"get_form_fields"}),": returns the form field instance that will be used to parse and validate this\nfilter's values from the querystring"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"get_query_fragment"}),": returns the query fragment to use as filter in ElasticSearch"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"get_aggs_fragment"}),": returns the query fragment to use to extract facets from\nElasticSearch aggregations"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"get_facet_info"}),": returns the dynamic facet information from a filter's Elasticsearch facet\nresults. Together with the facet's static information, it will be used to display the filter\nin its current status in the left side panel of the search page."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["We will not go into more details here about how filter definition classes work, but you can refer\nto the code of the existing filters as good examples of what is possible. The code, although not\ntrivial, was given much care and includes many comments in an attempt to help writing new custom\nfilters. Of course, don't hesitate to ask for help by\n",(0,s.jsx)(n.a,{href:"https://github.com/openfun/richie/issues",children:"opening an issue"}),"!"]})]})}function d(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(h,{...e})}):h(e)}},28453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>o});var i=t(96540);const s={},r=i.createContext(s);function a(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);