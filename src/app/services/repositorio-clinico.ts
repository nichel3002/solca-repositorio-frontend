import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriaClinicaRegional } from '../models/historia-clinica.model';

@Injectable({
  providedIn: 'root'
})
export class RepositorioClinicoService {
  private readonly apiUrl = 'http://localhost:8085/repositorio';
  private readonly authUrl = 'http://localhost:8085/auth/login';
  private readonly tokenKey = 'solca_jwt_token';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.authUrl, { username, password });
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  obtenerToken(): string {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
  }

  estaAutenticado(): boolean {
    return this.obtenerToken().length > 0;
  }

  obtenerHistoria(idPacienteRegional: string): Observable<HistoriaClinicaRegional> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.obtenerToken()}`
    });
    return this.http.get<HistoriaClinicaRegional>(`${this.apiUrl}/paciente/${idPacienteRegional}`, { headers });
  }
}

export interface AuthResponse {
  token: string;
  username: string;
  expiresInSeconds: number;
}
