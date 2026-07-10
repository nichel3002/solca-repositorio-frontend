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

  login(username: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, role });
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

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
