import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, HistoriaClinicaRegional, RegistroClinico, ServicioDisponible } from '../models/historia-clinica.model';

@Injectable({
  providedIn: 'root'
})
export class RepositorioClinicoService {
  private readonly apiUrl = '/api/repositorio';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password });
  }

  registrarUsuario(username: string, nombreCompleto: string, password: string, role: string, sede: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { username, nombreCompleto, password, role, sede });
  }

  obtenerHistoriaPorId(idPacienteRegional: string, token: string): Observable<HistoriaClinicaRegional> {
    return this.http.get<HistoriaClinicaRegional>(`${this.apiUrl}/paciente/${idPacienteRegional}`, {
      headers: this.authHeaders(token)
    });
  }

  obtenerHistoriaPorCedula(cedula: string, token: string): Observable<HistoriaClinicaRegional> {
    return this.http.get<HistoriaClinicaRegional>(`${this.apiUrl}/cedula/${cedula}`, {
      headers: this.authHeaders(token)
    });
  }

  obtenerAuditoria(token: string): Observable<RegistroClinico[]> {
    return this.http.get<RegistroClinico[]>(`${this.apiUrl}/auditoria`, {
      headers: this.authHeaders(token)
    });
  }

  obtenerServicios(token: string): Observable<ServicioDisponible[]> {
    return this.http.get<ServicioDisponible[]>(`${this.apiUrl}/servicios`, {
      headers: this.authHeaders(token)
    });
  }

  obtenerRepositorioClinicoPorPaciente(idPacienteRegional: string, token: string): Observable<RegistroClinico[]> {
    return this.http.get<RegistroClinico[]>(`${this.apiUrl}/clinico/paciente/${idPacienteRegional}`, {
      headers: this.authHeaders(token)
    });
  }

  crearPaciente(paciente: RegistroClinico, token: string): Observable<RegistroClinico> {
    return this.http.post<RegistroClinico>(`${this.apiUrl}/pacientes`, paciente, {
      headers: this.authHeaders(token)
    });
  }

  crearConsulta(consulta: RegistroClinico, token: string): Observable<RegistroClinico> {
    return this.http.post<RegistroClinico>(`${this.apiUrl}/consultas`, consulta, {
      headers: this.authHeaders(token)
    });
  }

  crearLaboratorio(resultado: RegistroClinico, token: string): Observable<RegistroClinico> {
    return this.http.post<RegistroClinico>(`${this.apiUrl}/laboratorio`, resultado, {
      headers: this.authHeaders(token)
    });
  }

  crearImagen(estudio: RegistroClinico, token: string): Observable<RegistroClinico> {
    return this.http.post<RegistroClinico>(`${this.apiUrl}/imagenes`, estudio, {
      headers: this.authHeaders(token)
    });
  }

  enviarDicomImagenologia(datos: {
    idPacienteRegional: string;
    sede: string;
    fechaEstudio: string;
    modalidad: string;
    descripcion: string;
    archivo: File;
  }, token: string): Observable<RegistroClinico> {
    const formData = new FormData();
    formData.append('idPacienteRegional', datos.idPacienteRegional);
    formData.append('sede', datos.sede);
    formData.append('fechaEstudio', datos.fechaEstudio);
    formData.append('modalidad', datos.modalidad);
    formData.append('descripcion', datos.descripcion);
    formData.append('archivo', datos.archivo);
    return this.http.post<RegistroClinico>(`${this.apiUrl}/imagenes/dicom`, formData, {
      headers: this.authHeaders(token)
    });
  }

  descargarDicom(id: string | number, token: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.apiUrl}/imagenes/${id}/dicom`, {
      headers: this.authHeaders(token),
      responseType: 'arraybuffer'
    });
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
