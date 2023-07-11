import React, { PropsWithChildren } from 'react';
import { CourseRun } from 'types';

export const DJANGO_CMS_PLUGIN_COURSE_RUN_CLASS = 'cms-plugin-courses-courserun-';

export const DjangoCMSPluginCourseRun = (courseRun: CourseRun) =>
  `cms-render-model cms-render-model-block ${DJANGO_CMS_PLUGIN_COURSE_RUN_CLASS}${courseRun.id}`;

export const DjangoCMSTemplate = ({ children, plugin }: PropsWithChildren<{ plugin: string }>) => {
  if (DjangoCMSIsDraft()) {
    return (
      <>
        <template className={`cms-plugin cms-plugin-start ${plugin}`} />
        {children}
        <template className={`cms-plugin cms-plugin-end ${plugin}`} />
      </>
    );
  }
  // We need to use fragment in order to force the type to JSX Element.
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

const DjangoCMSIsDraft = () => window.CMS?.config.mode === 'draft';

export const DjangoCMSPluginsInit = () => {
  // We need to be first remove existing plugins that were initialized to fulfill CMS._plugins,
  // otherwise they will cause conflicts during the initialization algorithm of plugins triggered
  // by CMS.Plugin._refreshPlugins()
  const elements = document.querySelectorAll(`div[class*='${DJANGO_CMS_PLUGIN_COURSE_RUN_CLASS}']`);
  elements.forEach((element) => element.remove());

  setTimeout(() => {
    window.CMS?.Plugin._initializeTree();
  });
};
