export interface User {
  full_name?: string;
  username: string;
  urls: {
    label: string;
    action: string | (() => void);
  }[];
}
