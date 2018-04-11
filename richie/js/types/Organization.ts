import Resource from './Resource';

export default interface Organization extends Resource {
  banner: string | null;
  code: string;
  logo: string | null;
  name: string;
}
