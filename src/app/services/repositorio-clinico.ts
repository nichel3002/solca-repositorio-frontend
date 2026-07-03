import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriaClinicaRegional } from '../models/historia-clinica.model';

@Injectable({
  providedIn: 'root'
})
export class RepositorioClinicoService {
  private readonly apiUrl = 'http://localhost:8085/repositorio';

  constructor(private readonly http: HttpClient) {}

  obtenerHistoria(idPacienteRegional: string): Observable<HistoriaClinicaRegional> {
    return this.http.get<HistoriaClinicaRegional>(`${this.apiUrl}/paciente/${idPacienteRegional}`);
  }
}
