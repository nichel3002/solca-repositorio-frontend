import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthResponse, HistoriaClinicaRegional, RegistroClinico, ServicioDisponible } from './models/historia-clinica.model';
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
  servicios: ServicioDisponible[] = [];
  cargando = false;
  cargandoAuditoria = false;
  cargandoServicios = false;
  guardando = false;
  error = '';
  exito = '';
  activeView: 'dashboard' | 'perfil' | 'historia' | 'laboratorio' | 'imagenologia' | 'consulta' | 'auditoria' = 'dashboard';

  pacientesDemo = ['REG-0001', 'REG-0002', 'REG-0003'];
  sedes = ['SOLCA Quito', 'SOLCA Manabi', 'SOLCA Cuenca'];
  sedeActual = 'SOLCA Quito';
  nuevoPaciente: RegistroClinico = {
    idPacienteRegional: 'REG-0004',
    cedula: '1710034065',
    nombres: 'Andrea Valeria',
    apellidos: 'Mora Santos',
    sedeOrigen: 'SOLCA Quito',
    fechaNacimiento: '1988-08-18',
    sexo: 'Femenino',
    direccion: 'Av. 10 de Agosto, Quito',
    telefono: '0964445556'
  };
  nuevaConsulta: RegistroClinico = {
    sede: 'SOLCA Quito',
    fechaConsulta: new Date().toISOString().slice(0, 10),
    especialidad: 'Oncologia Clinica',
    diagnostico: 'Control clinico regional',
    medicoTratante: 'Alberto Mendez',
    observaciones: 'Paciente valorado desde el repositorio regional.'
  };
  nuevoLaboratorio: RegistroClinico = {
    sede: 'SOLCA Quito',
    fechaResultado: new Date().toISOString().slice(0, 10),
    tipoExamen: 'Marcador tumoral',
    resultado: 'Normal',
    unidad: 'U/mL',
    rangoReferencia: '0 - 35'
  };
  nuevaImagen: RegistroClinico = {
    sede: 'SOLCA Quito',
    fechaEstudio: new Date().toISOString().slice(0, 10),
    modalidad: 'TAC',
    descripcion: 'Control toracoabdominal',
    urlPacs: 'https://pacs.solca.local/demo',
    informeRadiologico: 'Sin evidencia de progresion en el estudio de control.'
  };

  constructor(
    private readonly repositorioClinico: RepositorioClinicoService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ingresar(): void {
    this.cargando = true;
    this.error = '';
    this.exito = '';
    this.repositorioClinico.login(this.username, this.role).subscribe({
      next: (sesion) => {
        this.sesion = sesion;
        this.auditoria = [];
        this.activeView = 'dashboard';
        this.cargando = false;
        this.changeDetector.detectChanges();
        this.cargarServicios();
      },
      error: () => {
        this.error = 'No se pudo iniciar sesion con el rol seleccionado.';
        this.cargando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  consultar(cambiarVista = true, limpiarMensaje = true): void {
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

    if (this.criterioBusqueda === 'cedula' && !this.esCedulaEcuatoriana(id)) {
      this.error = 'Ingrese una cedula ecuatoriana valida de 10 digitos.';
      this.changeDetector.detectChanges();
      return;
    }

    this.cargando = true;
    this.error = '';
    if (limpiarMensaje) {
      this.exito = '';
    }
    this.historia = undefined;

    const consulta = this.criterioBusqueda === 'cedula'
      ? this.repositorioClinico.obtenerHistoriaPorCedula(id, this.sesion.token)
      : this.repositorioClinico.obtenerHistoriaPorId(id, this.sesion.token);

    consulta.subscribe({
      next: (historia) => {
        this.historia = historia;
        this.cargando = false;
        if (cambiarVista) {
          this.activeView = 'perfil';
        }
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

  cargarServicios(): void {
    if (!this.sesion) {
      return;
    }
    this.cargandoServicios = true;
    this.repositorioClinico.obtenerServicios(this.sesion.token).subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.cargandoServicios = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.servicios = [];
        this.error = 'No se pudo consultar el estado real de los servicios.';
        this.cargandoServicios = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  crearPaciente(): void {
    if (!this.sesion || !['ADMIN', 'MEDICO'].includes(this.sesion.role)) {
      this.error = 'Registrar paciente requiere rol MEDICO o ADMIN.';
      return;
    }
    const errorValidacion = this.validarPaciente();
    if (errorValidacion) {
      this.error = errorValidacion;
      this.exito = '';
      this.changeDetector.detectChanges();
      return;
    }
    const idPacienteNuevo = String(this.nuevoPaciente['idPacienteRegional'] ?? '').trim();
    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.changeDetector.detectChanges();
    this.repositorioClinico.crearPaciente(this.nuevoPaciente, this.sesion.token).subscribe({
      next: () => {
        this.guardando = false;
        this.idPacienteRegional = idPacienteNuevo;
        this.criterioBusqueda = 'id';
        this.exito = 'Paciente maestro registrado. Perfil regional cargado.';
        this.changeDetector.detectChanges();
        this.consultar(true, false);
      },
      error: () => {
        this.error = 'No se pudo registrar el paciente. Revise cedula, nombres, apellidos y duplicados.';
        this.guardando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  crearConsulta(): void {
    if (!this.sesion || !['ADMIN', 'MEDICO'].includes(this.sesion.role)) {
      this.error = 'Registrar consulta requiere rol MEDICO o ADMIN.';
      return;
    }
    const errorValidacion = this.validarConsulta();
    if (errorValidacion) {
      this.error = errorValidacion;
      this.exito = '';
      this.changeDetector.detectChanges();
      return;
    }
    const idPacienteRegional = this.idActualPaciente();
    this.guardar(
      () => this.repositorioClinico.crearConsulta({ ...this.nuevaConsulta, idPacienteRegional }, this.sesion!.token),
      'Consulta clinica guardada.'
    );
  }

  crearLaboratorio(): void {
    if (!this.sesion || !['ADMIN', 'LABORATORIO'].includes(this.sesion.role)) {
      this.error = 'Registrar laboratorio requiere rol LABORATORIO o ADMIN.';
      return;
    }
    const errorValidacion = this.validarLaboratorio();
    if (errorValidacion) {
      this.error = errorValidacion;
      this.exito = '';
      this.changeDetector.detectChanges();
      return;
    }
    const idPacienteRegional = this.idActualPaciente();
    this.guardar(
      () => this.repositorioClinico.crearLaboratorio({ ...this.nuevoLaboratorio, idPacienteRegional }, this.sesion!.token),
      'Resultado de laboratorio guardado.'
    );
  }

  crearImagen(): void {
    if (!this.sesion || !['ADMIN', 'MEDICO'].includes(this.sesion.role)) {
      this.error = 'Registrar imagenologia requiere rol MEDICO o ADMIN.';
      return;
    }
    const errorValidacion = this.validarImagen();
    if (errorValidacion) {
      this.error = errorValidacion;
      this.exito = '';
      this.changeDetector.detectChanges();
      return;
    }
    const idPacienteRegional = this.idActualPaciente();
    this.guardar(
      () => this.repositorioClinico.crearImagen({ ...this.nuevaImagen, idPacienteRegional }, this.sesion!.token),
      'Estudio de imagenologia guardado.'
    );
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

  serviciosDisponibles(): number {
    return this.servicios.filter((servicio) => servicio.disponible).length;
  }

  ultimoRegistro(lista: RegistroClinico[], campoFecha: string): string {
    return lista.length > 0 ? this.valor(lista[0], campoFecha) : 'Sin registros';
  }

  tituloVista(): string {
    const titulos: Record<typeof this.activeView, string> = {
      dashboard: 'Busqueda de Pacientes',
      perfil: 'Perfil del Paciente',
      historia: 'Historia Clinica',
      laboratorio: 'Laboratorio',
      imagenologia: 'Imagenologia',
      consulta: 'Generar Nueva Consulta',
      auditoria: 'Auditoria'
    };
    return titulos[this.activeView];
  }

  cerrarSesion(): void {
    this.sesion = undefined;
    this.historia = undefined;
    this.auditoria = [];
    this.servicios = [];
    this.error = '';
    this.exito = '';
    this.activeView = 'dashboard';
    this.changeDetector.detectChanges();
  }

  seleccionarVista(vista: 'dashboard' | 'perfil' | 'historia' | 'laboratorio' | 'imagenologia' | 'consulta' | 'auditoria'): void {
    this.activeView = vista;
  }

  private guardar(operacion: () => import('rxjs').Observable<RegistroClinico>, mensaje: string): void {
    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.changeDetector.detectChanges();
    operacion().subscribe({
      next: () => {
        this.exito = mensaje;
        this.guardando = false;
        this.changeDetector.detectChanges();
        if (this.historia) {
          this.consultar(false, false);
        }
      },
      error: () => {
        this.error = 'No se pudo guardar. Revise el rol de la sesion y los datos obligatorios.';
        this.guardando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  private idActualPaciente(): string {
    return this.valor(this.historia?.paciente, 'idPacienteRegional') !== 'No registrado'
      ? this.valor(this.historia?.paciente, 'idPacienteRegional')
      : this.idPacienteRegional.trim();
  }

  private validarPaciente(): string {
    if (!this.requerido(this.nuevoPaciente['idPacienteRegional'])) {
      return 'El Master ID es obligatorio.';
    }
    if (!this.esCedulaEcuatoriana(String(this.nuevoPaciente['cedula'] ?? ''))) {
      return 'La cedula debe ser ecuatoriana valida y tener 10 digitos.';
    }
    if (!this.soloLetras(this.nuevoPaciente['nombres'])) {
      return 'En nombres solo se permiten letras y espacios.';
    }
    if (!this.soloLetras(this.nuevoPaciente['apellidos'])) {
      return 'En apellidos solo se permiten letras y espacios.';
    }
    if (!this.requerido(this.nuevoPaciente['fechaNacimiento'])) {
      return 'La fecha de nacimiento es obligatoria.';
    }
    if (!this.telefonoValido(this.nuevoPaciente['telefono'])) {
      return 'El telefono debe contener entre 7 y 10 digitos.';
    }
    return '';
  }

  private validarConsulta(): string {
    if (!this.requerido(this.nuevaConsulta['fechaConsulta'])) {
      return 'La fecha de consulta es obligatoria.';
    }
    if (!this.soloLetras(this.nuevaConsulta['especialidad'])) {
      return 'En especialidad solo se permiten letras y espacios.';
    }
    if (!this.soloLetras(this.nuevaConsulta['medicoTratante'])) {
      return 'En medico tratante solo se permiten letras y espacios.';
    }
    if (!this.requerido(this.nuevaConsulta['diagnostico'])) {
      return 'El diagnostico es obligatorio.';
    }
    return '';
  }

  private validarLaboratorio(): string {
    if (!this.requerido(this.nuevoLaboratorio['fechaResultado'])) {
      return 'La fecha del resultado de laboratorio es obligatoria.';
    }
    if (!this.requerido(this.nuevoLaboratorio['tipoExamen'])) {
      return 'El tipo de examen es obligatorio.';
    }
    if (!this.requerido(this.nuevoLaboratorio['resultado'])) {
      return 'El resultado de laboratorio es obligatorio.';
    }
    return '';
  }

  private validarImagen(): string {
    if (!this.requerido(this.nuevaImagen['fechaEstudio'])) {
      return 'La fecha del estudio de imagenologia es obligatoria.';
    }
    if (!this.requerido(this.nuevaImagen['modalidad'])) {
      return 'La modalidad de imagenologia es obligatoria.';
    }
    if (!this.requerido(this.nuevaImagen['descripcion'])) {
      return 'La descripcion del estudio es obligatoria.';
    }
    if (!this.requerido(this.nuevaImagen['informeRadiologico'])) {
      return 'El informe radiologico es obligatorio.';
    }
    return '';
  }

  private requerido(valor: unknown): boolean {
    return String(valor ?? '').trim().length > 0;
  }

  private soloLetras(valor: unknown): boolean {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,}$/.test(String(valor ?? '').trim());
  }

  private telefonoValido(valor: unknown): boolean {
    return /^[0-9]{7,10}$/.test(String(valor ?? '').trim());
  }

  private esCedulaEcuatoriana(cedula: string): boolean {
    if (!/^[0-9]{10}$/.test(cedula)) {
      return false;
    }
    const provincia = Number(cedula.slice(0, 2));
    const tercerDigito = Number(cedula[2]);
    if (provincia < 1 || provincia > 24 || tercerDigito > 5) {
      return false;
    }
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const suma = coeficientes.reduce((total, coeficiente, indice) => {
      const producto = Number(cedula[indice]) * coeficiente;
      return total + (producto >= 10 ? producto - 9 : producto);
    }, 0);
    const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    return digitoVerificador === Number(cedula[9]);
  }
}
