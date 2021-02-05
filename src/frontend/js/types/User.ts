export interface User {
  full_name?: string;
  username: string;
  urls: {
    key: string;
    label: string;
    action: string | (() => void);
  }[];
}
