declare module '*settings.json' {
  export const API_ENDPOINTS: {
    courses: string;
    organizations: string;
    subjects: string;
  };

  export const SUPPORTED_LANGUAGES: string[];
}
