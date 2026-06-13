export interface Docente {
  id_docente: number;
  ci: string;
  nombre: string;
  apellido: string;
  genero: 'masculino' | 'femenino' | null;
  extension: 'LP' | 'CB' | 'SC' | 'CH' | 'OR' | 'PT' | 'TRJ' | 'BN' | 'PD' | null;
  grado: 'Dr.' | 'MSc.' | 'Mg.' | 'Esp.' | 'Ing.' | 'Lic.' | 'Otro' | null;
  titulo: string | null;
  correo: string;
  celular: string | null;
  estado: 'disponible' | 'contratado' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export type DocenteCreate = Omit<Docente, 'id_docente' | 'created_at' | 'updated_at'>;
