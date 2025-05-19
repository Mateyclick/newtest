export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  roles?: {
    socio?: boolean;
    site_admin?: boolean;
  };
  socio_hasta?: string | null; // Supabase devuelve fechas como string en formato ISO
  // created_at y updated_at son opcionales si los quieres mostrar
}