declare module '*settings.json' {
  export type API_ENDPOINTS_KEYS = 'courses' | 'organizations' | 'subjects';
  export const API_ENDPOINTS: { [key in API_ENDPOINTS_KEYS]: string };

  export const API_LIST_DEFAULT_PARAMS: {
    limit: number;
    offset: number;
  };

  export const SUPPORTED_LANGUAGES: string[];
}
