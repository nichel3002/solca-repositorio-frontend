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
