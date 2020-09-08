export interface User {
  full_name: string;
  username: string;
  urls: {
    label: string;
    href: string;
  }[];
}
