import { useParams } from 'react-router-dom';

const Course = () => {
  const { courseId } = useParams();
  return <h2>Individual Course {courseId}</h2>;
};

export default Course;
