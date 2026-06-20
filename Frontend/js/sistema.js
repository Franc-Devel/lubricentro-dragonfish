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
    // Cargamos también la grilla del maestro inicialmente
    cargarProductosMaestro();
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

    // Mantenemos actualizado el catálogo en memoria por si eligen un ítem del filtro
    productosFiltrados.forEach((prod) => {
      if (!dbProductos.some((x) => x.id === prod.id)) {
        dbProductos.push(prod);
      }
    });

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

// Renderiza la tabla de facturación actual con opción de eliminar ítems del remito
function renderTicket() {
  const b = document.getElementById("ticket-items");
  b.innerHTML = "";
  let tot = 0;

  if (!ticket.length) {
    b.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3">Terminal lista. Ingrese artículos.</td></tr>';
    document.getElementById("btn-finalizar").disabled = true;
    document.getElementById("ticket-total").innerText = "$0.00";
    return;
  }

  ticket.forEach((i, index) => {
    tot += i.sub;
    b.innerHTML +=
      "<tr>" +
      '<td><span class="text-info fw-bold">' +
      i.code +
      "</span></td>" +
      "<td>" +
      i.name.toUpperCase() +
      "</td>" +
      '<td class="text-center">' +
      i.cant +
      "</td>" +
      '<td class="text-end">$' +
      i.sub.toFixed(2) +
      "</td>" +
      '<td class="text-center">' +
      '<button type="button" class="p-0" onclick="quitarDelTicket(' +
      index +
      ')" style="background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 1rem;" title="Quitar ítem">🗑️</button>' +
      "</td>" +
      "</tr>";
  });

  document.getElementById("ticket-total").innerText = "$" + tot.toFixed(2);
  document.getElementById("btn-finalizar").disabled = false;
}

// Quita un renglón del remito actual en base a su posición en la lista
function quitarDelTicket(index) {
  ticket.splice(index, 1); // Remueve el elemento del array
  renderTicket(); // Vuelve a dibujar el remito actualizado
}

// Filtra el panel maestro de Stock e incluye el botón de baja definitivo
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
        '<tr><td colspan="6" class="text-center text-muted py-3">No se encontraron artículos.</td></tr>';
      return;
    }

    prods.forEach((p) => {
      b.innerHTML +=
        "<tr>" +
        '<td><span class="text-info fw-bold">' +
        p.code +
        "</span></td>" +
        "<td>" +
        p.name.toUpperCase() +
        "</td>" +
        "<td>" +
        p.presentation +
        "</td>" +
        '<td class="text-end">$' +
        p.price.toFixed(2) +
        "</td>" +
        '<td class="text-center">' +
        p.stock +
        "</td>" +
        '<td class="text-center">' +
        '<button type="button" onclick="eliminarProductoBD(' +
        p.id +
        ", '" +
        p.code +
        '\')" style="background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 1rem;" title="Eliminar de DB">🗑️</button>' +
        "</td>" +
        "</tr>";
    });
  } catch (err) {
    console.error("Error en grilla maestro:", err);
  }
}

// Petición física DELETE al Backend para impactar la BD en Aiven
async function eliminarProductoBD(id, code) {
  const confirmar = confirm(
    "⚠️ ¿Estás seguro de eliminar el artículo [" +
      code +
      "] permanentemente del sistema?",
  );
  if (!confirmar) return;

  try {
    const res = await fetch("http://localhost:3000/api/productos/" + id, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (res.ok) {
      alert("✅ Artículo eliminado de la base de datos.");
      inicializarVentas(); // Refresca el selector de ventas y la grilla
    } else {
      const data = await res.json();
      alert("❌ Error: " + (data.error || "No se pudo eliminar el artículo."));
    }
  } catch (err) {
    console.error("Error en petición DELETE:", err);
    alert("❌ Error de comunicación con el servidor central.");
  }
}
