import { ChangeDetectorRef, Component } from '@angular/core';
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
  activeView: 'dashboard' | 'historia' | 'repositorio' | 'consulta' = 'dashboard';

  pacientesDemo = ['REG-0001', 'REG-0002', 'REG-0003'];
  sedes = ['SOLCA Quito', 'SOLCA Manabi', 'SOLCA Cuenca'];

  constructor(
    private readonly repositorioClinico: RepositorioClinicoService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ingresar(): void {
    this.cargando = true;
    this.error = '';
    this.repositorioClinico.login(this.username, this.role).subscribe({
      next: (sesion) => {
        this.sesion = sesion;
        this.auditoria = [];
        this.cargando = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo iniciar sesion con el rol seleccionado.';
        this.cargando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  consultar(): void {
    const id = this.idPacienteRegional.trim();
    if (!this.sesion) {
      this.error = 'Seleccione un rol e inicie sesion antes de consultar.';
      this.changeDetector.detectChanges();
      return;
    }

    if (!id) {
      this.error = 'Ingrese una cedula o un identificador regional de paciente.';
      this.changeDetector.detectChanges();
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
        this.activeView = 'historia';
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo consultar el Repositorio Clinico Regional.';
        this.cargando = false;
        this.changeDetector.detectChanges();
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
    this.changeDetector.detectChanges();
    this.repositorioClinico.obtenerAuditoria(this.sesion.token).subscribe({
      next: (auditoria) => {
        this.auditoria = auditoria;
        this.cargandoAuditoria = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo consultar la auditoria. Requiere rol ADMIN.';
        this.cargandoAuditoria = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  campos(registro: RegistroClinico): string[] {
    return Object.keys(registro);
  }

  valor(registro: RegistroClinico | Record<string, unknown> | undefined, campo: string): string {
    const valor = registro?.[campo];
    return valor === undefined || valor === null || valor === '' ? 'No registrado' : String(valor);
  }

  etiqueta(campo: string): string {
    return campo
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^./, (letra) => letra.toUpperCase());
  }

  nombrePaciente(): string {
    if (!this.historia?.paciente) {
      return 'Paciente no seleccionado';
    }
    return `${this.valor(this.historia.paciente, 'nombres')} ${this.valor(this.historia.paciente, 'apellidos')}`;
  }

  inicialesPaciente(): string {
    const nombres = this.valor(this.historia?.paciente, 'nombres');
    const apellidos = this.valor(this.historia?.paciente, 'apellidos');
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  }

  totalRegistros(): number {
    return (this.historia?.consultas.length ?? 0) + (this.historia?.laboratorio.length ?? 0) + (this.historia?.imagenes.length ?? 0);
  }

  totalConsultas(): number {
    return this.historia?.consultas.length ?? 0;
  }

  totalLaboratorio(): number {
    return this.historia?.laboratorio.length ?? 0;
  }

  totalImagenes(): number {
    return this.historia?.imagenes.length ?? 0;
  }

  ultimoRegistro(lista: RegistroClinico[], campoFecha: string): string {
    return lista.length > 0 ? this.valor(lista[0], campoFecha) : 'Sin registros';
  }

  seleccionarVista(vista: 'dashboard' | 'historia' | 'repositorio' | 'consulta'): void {
    this.activeView = vista;
  }
}
