export interface Docente {
  id_docente: number;
  ci: string;
  nombre: string;
  apellido: string;
  titulo: string | null;
  correo: string;
  celular: string | null;
  estado: 'disponible' | 'contratado' | 'inactivo';
  created_at: string;
  updated_at: string;
}
