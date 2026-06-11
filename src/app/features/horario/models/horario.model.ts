export type Dia = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface Horario {
  id_horario: number;
  id_detalle_programa_modulo: number;
  dia: Dia;
  hora_ini: string;
  hora_fin: string;
  aula: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface HorarioCreate {
  id_detalle_programa_modulo: number;
  dia: Dia;
  hora_ini: string;
  hora_fin: string;
  aula?: string | null;
}

export interface HorarioUpdate {
  dia?: Dia;
  hora_ini?: string;
  hora_fin?: string;
  aula?: string | null;
  estado?: string;
}
