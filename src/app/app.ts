import { Component } from '@angular/core';
import { AuthResponse, HistoriaClinicaRegional, RegistroClinico } from './models/historia-clinica.model';
import { RepositorioClinicoService } from './services/repositorio-clinico';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  idPacienteRegional = 'REG-0001';
  criterioBusqueda: 'id' | 'cedula' = 'id';
  username = 'medico@solca.local';
  role: 'ADMIN' | 'MEDICO' | 'LABORATORIO' = 'MEDICO';
  sesion?: AuthResponse;
  historia?: HistoriaClinicaRegional;
  auditoria: RegistroClinico[] = [];
  cargando = false;
  cargandoAuditoria = false;
  error = '';

  pacientesDemo = ['REG-0001', 'REG-0002', 'REG-0003'];

  constructor(private readonly repositorioClinico: RepositorioClinicoService) {}

  ingresar(): void {
    this.error = '';
    this.repositorioClinico.login(this.username, this.role).subscribe({
      next: (sesion) => {
        this.sesion = sesion;
        this.auditoria = [];
      },
      error: () => {
        this.error = 'No se pudo iniciar sesion con el rol seleccionado.';
      }
    });
  }

  consultar(): void {
    const id = this.idPacienteRegional.trim();
    if (!this.sesion) {
      this.error = 'Seleccione un rol e inicie sesion antes de consultar.';
      return;
    }

    if (!id) {
      this.error = 'Ingrese una cedula o un identificador regional de paciente.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.historia = undefined;

    const consulta = this.criterioBusqueda === 'cedula'
      ? this.repositorioClinico.obtenerHistoriaPorCedula(id, this.sesion.token)
      : this.repositorioClinico.obtenerHistoriaPorId(id, this.sesion.token);

    consulta.subscribe({
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
    this.criterioBusqueda = 'id';
    this.idPacienteRegional = idPacienteRegional;
    this.consultar();
  }

  cargarAuditoria(): void {
    if (!this.sesion || this.sesion.role !== 'ADMIN') {
      return;
    }
    this.cargandoAuditoria = true;
    this.repositorioClinico.obtenerAuditoria(this.sesion.token).subscribe({
      next: (auditoria) => {
        this.auditoria = auditoria;
        this.cargandoAuditoria = false;
      },
      error: () => {
        this.error = 'No se pudo consultar la auditoria. Requiere rol ADMIN.';
        this.cargandoAuditoria = false;
      }
    });
  }

  campos(registro: RegistroClinico): string[] {
    return Object.keys(registro);
  }
}
