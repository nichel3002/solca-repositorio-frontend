import { Component } from '@angular/core';
import { HistoriaClinicaRegional, RegistroClinico } from './models/historia-clinica.model';
import { RepositorioClinicoService } from './services/repositorio-clinico';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  idPacienteRegional = 'REG-0001';
  historia?: HistoriaClinicaRegional;
  cargando = false;
  error = '';

  pacientesDemo = ['REG-0001', 'REG-0002', 'REG-0003'];

  constructor(private readonly repositorioClinico: RepositorioClinicoService) {}

  consultar(): void {
    const id = this.idPacienteRegional.trim();
    if (!id) {
      this.error = 'Ingrese un identificador regional de paciente.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.historia = undefined;

    this.repositorioClinico.obtenerHistoria(id).subscribe({
      next: (historia) => {
        this.historia = historia;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo consultar el Repositorio Clinico Regional.';
        this.cargando = false;
      }
    });
  }

  seleccionarPaciente(idPacienteRegional: string): void {
    this.idPacienteRegional = idPacienteRegional;
    this.consultar();
  }

  campos(registro: RegistroClinico): string[] {
    return Object.keys(registro);
  }
}
