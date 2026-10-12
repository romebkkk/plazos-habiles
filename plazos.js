/*! plazos-habiles — vencimiento de plazos (España) · DataFlow Elegance · MIT
 *  Ley 39/2015 art. 30 (administrativos) y LOPJ art. 182-183 (judiciales). Orientativo.
 *  Incluye festivos NACIONALES; añade los autonómicos/locales en "festivosExtra".
 */
(function (g) {
  "use strict";
  var DAY = 86400000;
  function U(y, m, dd) { return Date.UTC(y, m - 1, dd); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function parse(s) { var p = String(s).split("-"); return U(+p[0], +p[1], +p[2]); }

  function pascua(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), gg = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - gg + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return U(y, mes, dia);
  }

  function festivosNacionales(y) {
    return [U(y,1,1), U(y,1,6), pascua(y) - 2 * DAY, U(y,5,1), U(y,8,15), U(y,10,12), U(y,11,1), U(y,12,6), U(y,12,8), U(y,12,25)];
  }

  function esInhabil(t, tipo, extra) {
    var dt = new Date(t), wd = dt.getUTCDay();
    if (wd === 0 || wd === 6) return true;
    var y = dt.getUTCFullYear();
    var fest = festivosNacionales(y).concat(extra || []);
    if (fest.indexOf(t) !== -1) return true;
    if (tipo === "judicial") {
      if (dt.getUTCMonth() === 7) return true; // agosto
      var md = (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate();
      if (md === 1224 || md === 1231) return true;
    }
    return false;
  }

  /** p = { notificacion:"YYYY-MM-DD", dias:int, tipo:"habiles"|"naturales"|"judicial", festivosExtra:["YYYY-MM-DD"] } */
  function calcular(p) {
    var t = parse(p.notificacion), n = parseInt(p.dias, 10), tipo = p.tipo || "habiles";
    if (!(n > 0)) return { error: "Indica un número de días mayor que 0." };
    var extra = (p.festivosExtra || []).filter(Boolean).map(parse);
    var cur = t, contados = 0, saltados = [];
    while (contados < n) {
      cur += DAY;
      if (tipo === "naturales" || !esInhabil(cur, tipo, extra)) contados++;
      else saltados.push(iso(cur));
    }
    var prorrogado = false;
    while (esInhabil(cur, tipo === "naturales" ? "habiles" : tipo, extra)) { cur += DAY; prorrogado = true; }
    return {
      inicio_computo: iso(t + DAY),
      vencimiento: iso(cur),
      dias_inhabiles_saltados: saltados.length,
      prorrogado_por_inhabil: prorrogado,
      nota: tipo === "judicial" ? "Plazo judicial: excluye sábados, domingos, festivos, 24 y 31 de diciembre y agosto." :
            tipo === "naturales" ? "Días naturales: si el último día es inhábil, se prorroga al siguiente hábil." :
            "Días hábiles (Ley 39/2015): excluye sábados, domingos y festivos."
    };
  }

  g.Plazos = { calcular: calcular, festivosNacionales: festivosNacionales, pascua: pascua, iso: iso };
})(typeof window !== "undefined" ? window : globalThis);
