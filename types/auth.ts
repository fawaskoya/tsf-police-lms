export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  unit?: string | null;
  rank?: string | null;
  locale: string;
  image?: string | null;
}