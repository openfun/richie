declare module '*settings.json' {
  export const API_ENDPOINTS: {
    courses: string;
    organizations: string;
    subjects: string;
  };

  export const API_LIST_DEFAULT_PARAMS: {
    limit: number;
    offset: number;
  };

  export const SUPPORTED_LANGUAGES: string[];
}
