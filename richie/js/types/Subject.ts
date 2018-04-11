import Resource from './Resource';

export default interface Subject extends Resource {
  image: string | null;
  name: string;
}
