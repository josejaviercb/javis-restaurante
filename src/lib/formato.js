/**
 * Utilidades de formato en español. Centralizadas aquí para que fechas y
 * precios se muestren igual en toda la aplicación.
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MESES_CORTOS = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

export const DIAS_SEMANA_CORTOS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

export function formatearPrecio(valor) {
  const numero = Number(valor ?? 0);
  return `${numero.toFixed(2).replace('.', ',')}€`;
}

/** Convierte 'YYYY-MM-DD' en un Date local, evitando el desfase de UTC. */
export function fechaDesdeISO(cadena) {
  const [anyo, mes, dia] = cadena.split('-').map(Number);
  return new Date(anyo, mes - 1, dia);
}

/** Convierte un Date a 'YYYY-MM-DD' usando la fecha local, no UTC. */
export function fechaAISO(fecha) {
  const anyo = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anyo}-${mes}-${dia}`;
}

/** Ej: '10 de octubre de 2024' */
export function formatearFechaLarga(cadenaISO) {
  const fecha = fechaDesdeISO(cadenaISO);
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

export function obtenerMesCorto(cadenaISO) {
  return MESES_CORTOS[fechaDesdeISO(cadenaISO).getMonth()];
}

export function obtenerDiaMes(cadenaISO) {
  return fechaDesdeISO(cadenaISO).getDate();
}

export function nombreMesAnyo(fecha) {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`.toUpperCase();
}

/** 'HH:MM:SS' -> 'HH:MM' */
export function formatearHora(hora) {
  if (!hora) return '';
  return hora.slice(0, 5);
}

export function fechaDeHoyISO() {
  return fechaAISO(new Date());
}

/** Iniciales para los avatares de las tablas. */
export function obtenerIniciales(nombre) {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Una reserva es pasada si su fecha ya quedó atrás. */
export function esFechaPasada(cadenaISO) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaDesdeISO(cadenaISO) < hoy;
}

/** Minutos mínimos de antelación exigidos para reservar. */
export const ANTELACION_MINIMA_MINUTOS = 45;

/**
 * Indica si una franja horaria cumple la antelación mínima respecto al
 * momento actual. Solo restringe cuando la fecha es hoy: para fechas
 * futuras cualquier franja es válida; para fechas pasadas ninguna lo es.
 *
 * @param {string} fechaISO  Fecha de la reserva en formato 'YYYY-MM-DD'.
 * @param {string} hora      Hora de la franja ('HH:MM' o 'HH:MM:SS').
 * @param {number} minutos   Antelación mínima requerida (por defecto 45).
 */
export function franjaTieneAntelacionSuficiente(
  fechaISO,
  hora,
  minutos = ANTELACION_MINIMA_MINUTOS,
) {
  if (!fechaISO || !hora) return false;
  if (esFechaPasada(fechaISO)) return false;
  // Solo el día de hoy necesita comprobar la hora; el resto son futuros.
  if (fechaISO !== fechaDeHoyISO()) return true;

  const [horas, minutosFranja] = hora.split(':').map(Number);
  const momentoFranja = fechaDesdeISO(fechaISO);
  momentoFranja.setHours(horas, minutosFranja, 0, 0);

  const limite = new Date();
  limite.setMinutes(limite.getMinutes() + minutos);

  return momentoFranja >= limite;
}
