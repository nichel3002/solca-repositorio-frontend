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
  username = 'admin';
  password = 'admin123';
  idPacienteRegional = 'REG-0001';
  historia?: HistoriaClinicaRegional;
  cargando = false;
  consultando = false;
  error = '';
  autenticado = false;
  usuarioActivo = '';

  pacientesDemo = ['REG-0001', 'REG-0002', 'REG-0003'];

  constructor(private readonly repositorioClinico: RepositorioClinicoService) {
    this.autenticado = this.repositorioClinico.estaAutenticado();
    this.usuarioActivo = this.autenticado ? this.username : '';
  }

  login(): void {
    this.cargando = true;
    this.error = '';
    this.repositorioClinico.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        this.repositorioClinico.guardarToken(response.token);
        this.autenticado = true;
        this.usuarioActivo = response.username;
        this.cargando = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Credenciales invalidas. Use admin / admin123.';
        this.cargando = false;
      }
    });
  }

  cerrarSesion(): void {
    this.repositorioClinico.cerrarSesion();
    this.autenticado = false;
    this.historia = undefined;
    this.error = '';
  }

  consultar(): void {
    if (!this.autenticado) {
      this.error = 'Inicie sesion para consultar el repositorio clinico.';
      return;
    }

    const id = this.idPacienteRegional.trim();
    if (!id) {
      this.error = 'Ingrese un identificador regional de paciente.';
      return;
    }

    this.cargando = true;
    this.consultando = true;
    this.error = '';
    this.historia = undefined;

    this.repositorioClinico.obtenerHistoria(id).subscribe({
      next: (historia) => {
        this.historia = historia;
        this.cargando = false;
        this.consultando = false;
      },
      error: () => {
        this.error = 'No se pudo consultar el Repositorio Clinico Regional. Revise el token o el backend.';
        this.cargando = false;
        this.consultando = false;
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
