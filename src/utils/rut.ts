/**
 * Valida un RUT chileno (con guión y dígito verificador)
 * Algoritmo Módulo 11
 */
export function validarRut(rut: string): boolean {
  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;

  const [numero, dv] = rut.split("-");
  let suma = 0;
  let multiplicador = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalc = "";

  if (dvEsperado === 11) dvCalc = "0";
  else if (dvEsperado === 10) dvCalc = "K";
  else dvCalc = dvEsperado.toString();

  return dvCalc.toUpperCase() === dv.toUpperCase();
}

/**
 * Formatea un RUT a formato 12.345.678-9
 */
export function formatearRut(rut: string): string {
  const limpio = rut.replace(/[^0-9kK]/g, "");
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();

  let resultado = "";
  for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
    resultado = cuerpo[i] + (j > 0 && j % 3 === 0 ? "." : "") + resultado;
  }

  return `${resultado}-${dv}`;
}
