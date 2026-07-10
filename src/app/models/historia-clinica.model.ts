export interface HistoriaClinicaRegional {
  paciente: Record<string, unknown>;
  consultas: RegistroClinico[];
  laboratorio: RegistroClinico[];
  imagenes: RegistroClinico[];
  errores: Record<string, string>;
}

export interface RegistroClinico {
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: 'ADMIN' | 'MEDICO' | 'LABORATORIO';
}

export interface ServicioDisponible {
  nombre: string;
  codigo: string;
  endpoint: string;
  disponible: boolean;
  mensaje: string;
  latenciaMs: number | null;
}
