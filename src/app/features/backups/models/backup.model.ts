export interface Backup {
  id_backup: number;
  nombre: string;
  tamano_bytes: number;
  origen: 'manual' | 'auto' | 'previo_a_restaurar';
  estado: 'ok' | 'error';
  observacion: string | null;
  creado_por_id_usuario: number | null;
  created_at: string | null;
}

export interface ImportarBackupResult {
  ok: boolean;
  mensaje: string;
  backup_previo_id: number | null;
}
