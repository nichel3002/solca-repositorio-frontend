import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, HistoriaClinicaRegional, RegistroClinico } from '../models/historia-clinica.model';

@Injectable({
  providedIn: 'root'
})
export class RepositorioClinicoService {
  private readonly apiUrl = 'http://localhost:8085/repositorio';

  constructor(private readonly http: HttpClient) {}

  login(username: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:8085/auth/login', { username, role });
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

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
