declare module '*settings.json' {
  export const API_ENDPOINTS: {
    course: string;
    organization: string;
    subject: string;
  };

  export const SUPPORTED_LANGUAGES: string[];
}
