let dbProductos = [];
let ticket = [];

document.addEventListener("DOMContentLoaded", () => {
  // Verificación de sesión de operador
  if (!localStorage.getItem("token"))
    return (window.location.href = "login.html");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById("operator-display").innerText =
    "Operador: " + user.name.toUpperCase();

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Carga inicial mapeando la base de datos completa
  inicializarVentas();

  document
    .getElementById("form-add-venta")
    .addEventListener("submit", alAgregar);

  document.getElementById("btn-finalizar").addEventListener("click", () => {
    alert("Comprobante emitido correctamente.");
    ticket = [];
    renderTicket();
  });

  // ==========================================================================
  // BUSCADORES REACTIVOS EN TIEMPO REAL (Filtro instantáneo al escribir)
  // ==========================================================================

  // TERMINAL VENTAS: Filtra el select al instante a medida que escribís
  document
    .getElementById("input-filtrar-venta")
    .addEventListener("input", () => {
      filtrarSelectVentas();
    });

  // MAESTRO STOCK: Filtra la grilla al instante a medida que escribís
  document.getElementById("input-buscar-prod").addEventListener("input", () => {
    cargarProductosMaestro();
  });
});

// Carga inicial (trae todo de la DB)
async function inicializarVentas() {
  try {
    const res = await fetch("http://localhost:3000/api/productos");
    dbProductos = await res.json();
    poblarSelectProductos(dbProductos);
  } catch (err) {
    console.error("Error cargando tabla inicial:", err);
  }
}

// Inyecta dinámicamente las opciones filtradas en el <select>
function poblarSelectProductos(lista) {
  const select = document.getElementById("venta-producto-select");
  select.innerHTML = "";

  if (lista.length === 0) {
    select.innerHTML =
      '<option value="" disabled selected>-- NO HAY COINCIDENCIAS --</option>';
    return;
  }

  select.innerHTML =
    '<option value="" disabled selected>-- SELECCIONE ARTÍCULO (' +
    lista.length +
    " encontrados) --</option>";
  lista.forEach((p) => {
    select.innerHTML +=
      '<option value="' +
      p.id +
      '">[' +
      p.code +
      "] " +
      p.name.toUpperCase() +
      " (" +
      p.presentation +
      ") - $" +
      p.price +
      "</option>";
  });
}

// Hace la consulta al Backend y repobla el select de ventas al instante
async function filtrarSelectVentas() {
  const query = document.getElementById("input-filtrar-venta").value.trim();
  const url = query
    ? "http://localhost:3000/api/productos?q=" + encodeURIComponent(query)
    : "http://localhost:3000/api/productos";

  try {
    const res = await fetch(url);
    const productosFiltrados = await res.json();
    poblarSelectProductos(productosFiltrados);

    // Si encontró artículos, seleccionamos automáticamente el primero de la lista útil
    if (productosFiltrados.length > 0) {
      document.getElementById("venta-producto-select").selectedIndex = 1;
    }
  } catch (err) {
    console.error("Error filtrando caja de ventas:", err);
  }
}

// Acción de agregar ítem al remito actual
function alAgregar(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("venta-producto-select").value);
  const cant = parseInt(document.getElementById("venta-cantidad").value);
  if (!id) return;

  const p = dbProductos.find((x) => x.id === id);
  if (p) {
    ticket.push({ code: p.code, name: p.name, cant, sub: p.price * cant });
    renderTicket();

    // Limpiamos los filtros y restauramos la lista completa para el siguiente artículo
    document.getElementById("input-filtrar-venta").value = "";
    poblarSelectProductos(dbProductos);
    document.getElementById("form-add-venta").reset();
  }
}

// Renderiza la tabla de facturación actual
function renderTicket() {
  const b = document.getElementById("ticket-items");
  b.innerHTML = "";
  let tot = 0;

  if (!ticket.length) {
    b.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted py-3">Terminal lista. Ingrese artículos.</td></tr>';
    document.getElementById("btn-finalizar").disabled = true;
    document.getElementById("ticket-total").innerText = "$0.00";
    return;
  }

  ticket.forEach((i) => {
    tot += i.sub;
    b.innerHTML +=
      '<tr><td><span class="text-info fw-bold">' +
      i.code +
      "</span></td><td>" +
      i.name.toUpperCase() +
      '</td><td class="text-center">' +
      i.cant +
      '</td><td class="text-end">$' +
      i.sub.toFixed(2) +
      "</td></tr>";
  });

  document.getElementById("ticket-total").innerText = "$" + tot.toFixed(2);
  document.getElementById("btn-finalizar").disabled = false;
}

// Filtra el panel maestro de Stock por query param parcial
async function cargarProductosMaestro() {
  const query = document.getElementById("input-buscar-prod").value.trim();
  const url = query
    ? "http://localhost:3000/api/productos?q=" + encodeURIComponent(query)
    : "http://localhost:3000/api/productos";

  try {
    const res = await fetch(url);
    const prods = await res.json();
    const b = document.getElementById("tabla-productos-body");
    b.innerHTML = "";

    if (!prods.length) {
      b.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-3">No se encontraron artículos.</td></tr>';
      return;
    }

    prods.forEach((p) => {
      b.innerHTML +=
        '<tr><td><span class="text-info fw-bold">' +
        p.code +
        "</span></td><td>" +
        p.name.toUpperCase() +
        "</td><td>" +
        p.presentation +
        '</td><td class="text-end">$' +
        p.price.toFixed(2) +
        '</td><td class="text-center">' +
        p.stock +
        "</td></tr>";
    });
  } catch (err) {
    console.error("Error en grilla maestro:", err);
  }
}
