---
id: filters-customization
title: Customizing search filters
sidebar_label: Search filters customization
---

You may want to customize the filters on the left side bar of the search page.

Richie makes it easy to choose which filters you want to display among the existing filters
and in which order. You can also configure the existing filters to change their title or the
way they behave. Lastly, you can completely override a filter or create your own custom filter
from scratch.

## Filters configuration

Filters must first be defined in the `FILTERS_CONFIGURATION` setting. It is a dictionary defining
for each filter, a predefined `class` in the code where the filter is implemented and the
parameters to apply to this class when instantiating it.

Let's study a few examples of filters in the default configuration:

```
FILTERS_CONFIGURATION = {
    ...
    "pace": {
        "class": "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
        "params": {
            "fragment_map": {
                "self-paced": [{"bool": {"must_not": {"exists": {"field": "pace"}}}}],
                "lt-1h": [{"range": {"pace": {"lt": 60}}}],
                "1h-2h": [{"range": {"pace": {"gte": 60, "lte": 120}}}],
                "gt-2h": [{"range": {"pace": {"gt": 120}}}],
            },
            "human_name": _("Weekly pace"),
            "min_doc_count": 0,
            "sorting": "conf",
            "values": {
                "self-paced": _("Self-paced"),
                "lt-1h": _("Less than one hour"),
                "1h-2h": _("One to two hours"),
                "gt-2h": _("More than two hours"),
            },
        },
    },
    ...
}
```

This filter uses the `StaticChoicesFilterDefinition` filter definition class and allows filtering
on the `pace` field present in the Elasticsearch index. The `values` parameter defines 4 ranges
and their human readable format that will appear as 4 filtering options to the user.

The `fragment_map` parameter defines a fragment of the Elasticsearch query to apply on the `pace`
field when one of these options is selected.

The `human_name`parameter defines how the filter is entitled. It is defined as a lazy i18n string
so that it can be translated.

The `sorting` parameter determines how the facets are sorted in the left side panel of the filter:
- `conf`: facets are sorted as defined in the `values` configuration parameter
- `count`: facets are sorted according to the number of course results associated with each facet
- `name`: facets are sorted by their name in alphabetical order

The `min_doc_count` parameter defines how many associated results a facet must have at the minimum
before it is displayed as an option for the filter.

Let's study another interesting example:

```
FILTERS_CONFIGURATION = {
    ...
    "organizations": {
        "class": "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
        "params": {
            "human_name": _("Organizations"),
            "is_autocompletable": True,
            "is_drilldown": False,
            "is_searchable": True,
            "min_doc_count": 0,
            "reverse_id": "organizations",
        },
    },
    ...
}
```

This filter uses the `IndexableHierarchicalFilterDefinition` filter definition class and allows
filtering on the link between course pages and other pages identified by their IDs like for
example here `Organization` pages.

In the example above, when an option is selected, results will only include the courses for which
the `organizations` field in the index is including the ID of the selected organization page.

The `reverse_id` parameter should point to a page's reverse ID (see DjangoCMS documentation) in
the CMS. The filter will propose a filtering option for each children organization under this
page.

The `is_autocompletable` field determines whether organizations should be searched and suggested
by the autocomplete feature (organizations must have an associated index and API endpoint for
autocompletion carrying the same name).

The `is_drilldown` parameter determines whether the filter is limited to one active value at a
time or allows multi-facetting.

The `is_searchable` field determines whether organizations filters should present a "more options"
button in case there are more facet options in results than can be displayed (organizations must
have an associated API endpoint for full-text search, carrying the same name).

Lastly, let's look at nested filters which, as their name indicates, allow filtering on nested
fields.

For example, in the course index, one of the fields is named `course_runs` and contains a list of
objects in the following format:

```
"course_runs": [
    {
        "start": "2022-09-09T09:00:00.000000",
        "end": "2021-10-30T00:00:00.000000Z",
        "enrollment_start": "2022-08-01T09:00:00.000000Z",
        "enrollment_end": "2022-09-08T00:00:00.000000Z",
        "languages": ["en", "fr"],
    },
    {
        "start": "2023-03-01T09:00:00.000000",
        "end": "2023-06-03T00:00:00.000000Z",
        "enrollment_start": "2023-01-01T09:00:00.000000Z",
        "enrollment_end": "2023-03-01T00:00:00.000000Z",
        "languages": ["fr"],
    },
]
```

If we want to filter courses that are available in the english language, we can thus configure the
following filter:

```
FILTERS_CONFIGURATION = {
    ...
    "course_runs": {
        "class": "richie.apps.search.filter_definitions.NestingWrapper",
        "params": {
            "filters": {
                "languages": {
                    "class": "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    "params": {
                        "human_name": _("Languages"),
                        # There are too many available languages to show them all, all the time.
                        # Eg. 200 languages, 190+ of which will have 0 matching courses.
                        "min_doc_count": 1,
                    },
                },
            }
        },
    },
    ...
}
```

## Filters presentation

Which filters are displayed in the left side bar of the search page and in which order is defined
by the `RICHIE_FILTERS_PRESENTATION` setting.

This setting is expecting a list of strings, which are the names of the filters as defined
in the `FILTERS_CONFIGURATION` setting decribed in the previous section. If it, for example,
contains the 3 filters presented in the previous section, we could define the following
presentation:

```
RICHIE_FILTERS_PRESENTATION = ["organizations", "languages", "pace"]
```

## Writing your own custom filters

You can write your own filters from scratch although we must warn you that it is not trivial
because it requires a good knowledge of Elasticsearch and studying the mapping defined in the
[courses indexer][1].

A filter is a class deriving from [BaseFilterDefinition][2] and defining methods to return the
information to display the filter and query fragments for elasticsearch:
- `get_form_fields`: returns the form field instance that will be used to parse and validate this
    filter's values from the querystring
- `get_query_fragment`: returns the query fragment to use as filter in ElasticSearch
- `get_aggs_fragment`: returns the query fragment to use to extract facets from
    ElasticSearch aggregations
- `get_facet_info`: returns the dynamic facet information from a filter's Elasticsearch facet
    results. Together with the facet's static information, it will be used to display the filter
    in its current status in the left side panel of the search page.

We will not go into more details here about how filter definition classes work, but you can refer
to the code of the existing filters as good examples of what is possible. The code, although not
trivial, was given much care and includes many comments in an attempt to help writing new custom
filters. Of course, don't hesitate to ask for help by
[opening an issue](https://github.com/openfun/richie/issues)!

[1]: https://github.com/openfun/richie/blob/master/src/richie/apps/search/indexers/courses.py
[2]: https://github.com/openfun/richie/blob/master/src/richie/apps/search/filter_definitions/base.py
