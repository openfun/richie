import { useEffect } from 'react';

declare let CMS: any;

const CourseRunsSubHeader = () => {
  useEffect(() => {
    CMS.Plugin._initializeTree();
  }, []);

  return (
    <div className="cms-plugin cms-plugin-courses-courserun-121 cms-render-model cms-render-model-block">
      Hello world
    </div>
  );
};

export default CourseRunsSubHeader;
