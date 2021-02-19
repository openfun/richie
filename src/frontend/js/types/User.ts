export interface User {
  access_token?: string;
  full_name?: string;
  urls: {
    key: string;
    label: string;
    action: string | (() => void);
  }[];
  username: string;
}
