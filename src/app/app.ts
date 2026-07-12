import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import * as dicomParser from 'dicom-parser';
import { AuthResponse, HistoriaClinicaRegional, RegistroClinico, ServicioDisponible } from './models/historia-clinica.model';
import { RepositorioClinicoService } from './services/repositorio-clinico';

type AppView = 'dashboard' | 'paciente' | 'perfil' | 'historia' | 'laboratorio' | 'imagenologia' | 'consulta' | 'registroLaboratorio' | 'registroImagenologia' | 'auditoria';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  @ViewChild('dicomCanvas') dicomCanvas?: ElementRef<HTMLCanvasElement>;

  idPacienteRegional = 'REG-0001';
  modoAuth: 'login' | 'registro' = 'login';
  username = 'medico@solca.local';
  password = '';
  nombreCompleto = '';
  role: 'ADMIN' | 'MEDICO' | 'LABORATORIO' = 'MEDICO';
  sesion?: AuthResponse;
  historia?: HistoriaClinicaRegional;
  auditoria: RegistroClinico[] = [];
  servicios: ServicioDisponible[] = [];
  estudioSeleccionado?: RegistroClinico;
  dicomMetadata: RegistroClinico = {};
  cargandoDicom = false;
  cargando = false;
  cargandoAuditoria = false;
  cargandoServicios = false;
  guardando = false;
  error = '';
  exito = '';
  activeView: AppView = 'dashboard';

  sedes = ['SOLCA Quito', 'SOLCA Manabi', 'SOLCA Cuenca'];
  sedeActual = 'SOLCA Quito';
  nuevoPaciente: RegistroClinico = this.crearPacienteVacio();
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
    descripcion: 'Control toracoabdominal'
  };
  archivoDicom?: File;

  constructor(
    private readonly repositorioClinico: RepositorioClinicoService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ingresar(): void {
    this.cargando = true;
    this.error = '';
    this.exito = '';
    this.repositorioClinico.login(this.username, this.password).subscribe({
      next: (sesion) => {
        this.abrirSesion(sesion);
      },
      error: () => {
        this.error = 'No se pudo iniciar sesion. Revise usuario y contrasena.';
        this.cargando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  registrarUsuario(): void {
    if (!this.username.trim() || !this.nombreCompleto.trim() || !this.password.trim()) {
      this.error = 'Ingrese usuario clinico, nombre completo y contrasena.';
      this.changeDetector.detectChanges();
      return;
    }
    if (this.password.trim().length < 6) {
      this.error = 'La contrasena debe tener al menos 6 caracteres.';
      this.changeDetector.detectChanges();
      return;
    }
    this.cargando = true;
    this.error = '';
    this.exito = '';
    this.repositorioClinico.registrarUsuario(this.username, this.nombreCompleto, this.password, this.role, this.sedeActual).subscribe({
      next: (sesion) => {
        this.exito = 'Usuario clinico registrado.';
        this.abrirSesion(sesion);
      },
      error: () => {
        this.error = 'No se pudo registrar. Revise si el usuario ya existe.';
        this.cargando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  consultar(cambiarVista = true, limpiarMensaje = true): void {
    const terminoBusqueda = this.idPacienteRegional.trim();
    if (!this.sesion) {
      this.error = 'Inicie sesion antes de consultar.';
      this.changeDetector.detectChanges();
      return;
    }

    if (!terminoBusqueda) {
      this.error = 'Ingrese una cedula o un identificador regional de paciente.';
      this.changeDetector.detectChanges();
      return;
    }

    const buscarPorCedula = /^[0-9]+$/.test(terminoBusqueda);
    if (buscarPorCedula && !this.esCedulaEcuatoriana(terminoBusqueda)) {
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

    const consulta = buscarPorCedula
      ? this.repositorioClinico.obtenerHistoriaPorCedula(terminoBusqueda, this.sesion.token)
      : this.repositorioClinico.obtenerHistoriaPorId(terminoBusqueda, this.sesion.token);

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
    if (!this.requerido(this.nuevoPaciente['idPacienteRegional'])) {
      this.nuevoPaciente['idPacienteRegional'] = this.generarMasterId();
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
        this.exito = 'Paciente maestro registrado. Perfil regional cargado.';
        this.nuevoPaciente = this.crearPacienteVacio();
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
      () => this.repositorioClinico.crearConsulta({ ...this.nuevaConsulta, sede: this.sedeActual, idPacienteRegional }, this.sesion!.token),
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
      () => this.repositorioClinico.crearLaboratorio({ ...this.nuevoLaboratorio, sede: this.sedeActual, idPacienteRegional }, this.sesion!.token),
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
    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.changeDetector.detectChanges();
    this.repositorioClinico.enviarDicomImagenologia({
        idPacienteRegional,
        sede: this.sedeActual,
        fechaEstudio: String(this.nuevaImagen['fechaEstudio'] ?? ''),
        modalidad: String(this.nuevaImagen['modalidad'] ?? ''),
        descripcion: String(this.nuevaImagen['descripcion'] ?? ''),
        archivo: this.archivoDicom!
      }, this.sesion.token).subscribe({
      next: () => {
        this.exito = 'DICOM enviado a imagenologia por protocolo DICOM C-STORE.';
        this.guardando = false;
        this.archivoDicom = undefined;
        this.changeDetector.detectChanges();
        this.consultar(false, false);
      },
      error: () => {
        this.error = 'No se pudo enviar el DICOM. Verifique que sea .dcm/.dicom valido.';
        this.guardando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  seleccionarDicom(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.archivoDicom = archivo;
    if (!archivo) {
      return;
    }
    const nombre = archivo.name.toLowerCase();
    if (!nombre.endsWith('.dcm') && !nombre.endsWith('.dicom')) {
      this.archivoDicom = undefined;
      input.value = '';
      this.error = 'Solo se permite seleccionar archivos DICOM (.dcm o .dicom).';
      this.exito = '';
      this.changeDetector.detectChanges();
      return;
    }
    this.error = '';
    this.changeDetector.detectChanges();
  }

  verDicom(estudio: RegistroClinico): void {
    if (!this.sesion) {
      return;
    }
    const id = this.valor(estudio, 'id');
    if (id === 'No registrado') {
      this.error = 'El estudio no tiene identificador para abrir el DICOM.';
      return;
    }
    this.estudioSeleccionado = estudio;
    this.dicomMetadata = {};
    this.cargandoDicom = true;
    this.error = '';
    this.changeDetector.detectChanges();
    this.repositorioClinico.descargarDicom(id, this.sesion.token).subscribe({
      next: (archivo) => {
        try {
          this.renderizarDicom(archivo);
          this.cargandoDicom = false;
          this.changeDetector.detectChanges();
        } catch {
          this.error = 'No se pudo visualizar este DICOM. Verifique que sea una imagen monocromatica sin compresion.';
          this.cargandoDicom = false;
          this.changeDetector.detectChanges();
        }
      },
      error: () => {
        this.error = 'Este estudio no tiene DICOM disponible para visualizar.';
        this.cargandoDicom = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  cerrarVisorDicom(): void {
    this.estudioSeleccionado = undefined;
    this.dicomMetadata = {};
    const canvas = this.dicomCanvas?.nativeElement;
    const contexto = canvas?.getContext('2d');
    if (canvas && contexto) {
      contexto.clearRect(0, 0, canvas.width, canvas.height);
    }
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
    const titulos: Record<AppView, string> = {
      dashboard: 'Busqueda de Pacientes',
      paciente: 'Registrar Paciente',
      perfil: 'Perfil del Paciente',
      historia: 'Historia Clinica',
      laboratorio: 'Laboratorio',
      imagenologia: 'Imagenologia',
      consulta: 'Generar Nueva Consulta',
      registroLaboratorio: 'Registrar Laboratorio',
      registroImagenologia: 'Enviar DICOM',
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

  seleccionarVista(vista: AppView): void {
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

  private abrirSesion(sesion: AuthResponse): void {
    this.sesion = sesion;
    this.role = sesion.role;
    this.username = sesion.username;
    this.sedeActual = sesion.sede || 'SOLCA Quito';
    this.nuevaConsulta['sede'] = this.sedeActual;
    this.nuevoLaboratorio['sede'] = this.sedeActual;
    this.nuevaImagen['sede'] = this.sedeActual;
    this.auditoria = [];
    this.activeView = 'dashboard';
    this.cargando = false;
    this.changeDetector.detectChanges();
    this.cargarServicios();
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
    if (!this.archivoDicom) {
      return 'Adjunte un archivo DICOM (.dcm o .dicom).';
    }
    const nombre = this.archivoDicom.name.toLowerCase();
    if (!nombre.endsWith('.dcm') && !nombre.endsWith('.dicom')) {
      return 'Solo se permite subir archivos DICOM (.dcm o .dicom).';
    }
    return '';
  }

  private renderizarDicom(archivo: ArrayBuffer): void {
    const bytes = new Uint8Array(archivo);
    const dataSet = dicomParser.parseDicom(bytes);
    const rows = dataSet.uint16('x00280010') ?? 0;
    const columns = dataSet.uint16('x00280011') ?? 0;
    const bitsAllocated = dataSet.uint16('x00280100') ?? 16;
    const pixelRepresentation = dataSet.uint16('x00280103') ?? 0;
    const intercept = Number(dataSet.string('x00281052') ?? 0);
    const slope = Number(dataSet.string('x00281053') ?? 1);
    const pixelData = dataSet.elements['x7fe00010'];
    if (!rows || !columns || !pixelData) {
      throw new Error('DICOM sin datos de imagen.');
    }

    const cantidad = rows * columns;
    const valores = new Float32Array(cantidad);
    let minimo = Number.POSITIVE_INFINITY;
    let maximo = Number.NEGATIVE_INFINITY;
    const inicio = pixelData.dataOffset;
    for (let indice = 0; indice < cantidad; indice += 1) {
      let valor: number;
      if (bitsAllocated === 8) {
        valor = bytes[inicio + indice];
      } else {
        const offset = inicio + indice * 2;
        valor = pixelRepresentation === 1
          ? new DataView(bytes.buffer).getInt16(offset, true)
          : new DataView(bytes.buffer).getUint16(offset, true);
      }
      valor = valor * slope + intercept;
      valores[indice] = valor;
      minimo = Math.min(minimo, valor);
      maximo = Math.max(maximo, valor);
    }

    const canvas = this.dicomCanvas?.nativeElement;
    const contexto = canvas?.getContext('2d');
    if (!canvas || !contexto) {
      throw new Error('Canvas no disponible.');
    }
    canvas.width = columns;
    canvas.height = rows;
    const imagen = contexto.createImageData(columns, rows);
    const rango = maximo - minimo || 1;
    for (let indice = 0; indice < cantidad; indice += 1) {
      const gris = Math.max(0, Math.min(255, Math.round(((valores[indice] - minimo) / rango) * 255)));
      const base = indice * 4;
      imagen.data[base] = gris;
      imagen.data[base + 1] = gris;
      imagen.data[base + 2] = gris;
      imagen.data[base + 3] = 255;
    }
    contexto.putImageData(imagen, 0, 0);
    this.dicomMetadata = {
      paciente: dataSet.string('x00100010') ?? 'Anonimizado',
      estudio: dataSet.string('x00081030') ?? this.valor(this.estudioSeleccionado, 'descripcion'),
      modalidad: dataSet.string('x00080060') ?? this.valor(this.estudioSeleccionado, 'modalidad'),
      filas: rows,
      columnas: columns,
      bits: bitsAllocated
    };
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

  private crearPacienteVacio(): RegistroClinico {
    return {
      idPacienteRegional: this.generarMasterId(),
      cedula: '',
      nombres: '',
      apellidos: '',
      sedeOrigen: 'SOLCA Quito',
      fechaNacimiento: '',
      sexo: '',
      direccion: '',
      telefono: ''
    };
  }

  private generarMasterId(): string {
    return `REG-${Date.now().toString().slice(-8)}`;
  }
}
