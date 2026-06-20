let dbProductos = [];
let ticket = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token"))
    return (window.location.href = "login.html");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById("operator-display").innerText =
    "Operador: " + user.name.toUpperCase();

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  inicializarVentas();

  document
    .getElementById("form-add-venta")
    .addEventListener("submit", alAgregar);
  document
    .getElementById("btn-finalizar")
    .addEventListener("click", mostrarModalCobro);

  // CONEXIÓN FÍSICA DEL COBRO AL SERVIDOR CENTRAL
  document
    .getElementById("btn-confirmar-pago")
    .addEventListener("click", liquidarVentaServidor);

  document
    .getElementById("form-producto")
    .addEventListener("submit", guardarProductoBD);

  // CONTROL DE DROPDOWN FLUIDO CON ENTER
  const inputFiltrar = document.getElementById("input-filtrar-venta");
  inputFiltrar.addEventListener("input", filtrarSelectVentas);

  inputFiltrar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const select = document.getElementById("venta-producto-select");
      select.focus();
      if (select.options.length > 1) select.size = select.options.length;
    }
  });

  const selectVenta = document.getElementById("venta-producto-select");
  selectVenta.addEventListener("blur", () => {
    selectVenta.size = 0;
  });
  selectVenta.addEventListener("change", () => {
    selectVenta.size = 0;
  });

  document
    .getElementById("input-buscar-prod")
    .addEventListener("input", cargarProductosMaestro);
});

async function inicializarVentas() {
  try {
    const res = await fetch("http://localhost:3000/api/productos");
    dbProductos = await res.json();
    poblarSelectProductos(dbProductos);
    cargarProductosMaestro();
  } catch (err) {
    console.error("Error cargando tabla inicial:", err);
  }
}

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

async function filtrarSelectVentas() {
  const query = document.getElementById("input-filtrar-venta").value.trim();
  const url = query
    ? "http://localhost:3000/api/productos?q=" + encodeURIComponent(query)
    : "http://localhost:3000/api/productos";

  try {
    const res = await fetch(url);
    const productosFiltrados = await res.json();
    poblarSelectProductos(productosFiltrados);

    productosFiltrados.forEach((prod) => {
      if (!dbProductos.some((x) => x.id === prod.id)) dbProductos.push(prod);
    });

    if (productosFiltrados.length > 0) {
      document.getElementById("venta-producto-select").selectedIndex = 1;
    }
  } catch (err) {
    console.error(err);
  }
}

function alAgregar(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("venta-producto-select").value);
  const cant = parseInt(document.getElementById("venta-cantidad").value);
  if (!id) return;

  const p = dbProductos.find((x) => x.id === id);
  if (p) {
    const itemExistente = ticket.find((x) => x.code === p.code);
    if (itemExistente) {
      itemExistente.cant += cant;
      itemExistente.sub = itemExistente.price * itemExistente.cant;
    } else {
      ticket.push({
        code: p.code,
        name: p.name,
        price: p.price,
        cant,
        sub: p.price * cant,
      });
    }
    renderTicket();
    document.getElementById("input-filtrar-venta").value = "";
    poblarSelectProductos(dbProductos);
    document.getElementById("form-add-venta").reset();
    document.getElementById("input-filtrar-venta").focus();
  }
}

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
      '<td class="text-center" style="width: 90px;">' +
      '<input type="number" class="form-control bg-dark text-white border-secondary form-control-sm text-center p-0" value="' +
      i.cant +
      '" min="1" oninput="actualizarCantidad(' +
      index +
      ', this.value)" style="height: 25px;" />' +
      "</td>" +
      '<td class="text-end">$' +
      i.sub.toFixed(2) +
      "</td>" +
      '<td class="text-center">' +
      '<button type="button" class="p-0" onclick="quitarDelTicket(' +
      index +
      ')" style="background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 1rem;">🗑️</button>' +
      "</td>" +
      "</tr>";
  });

  document.getElementById("ticket-total").innerText = "$" + tot.toFixed(2);
  document.getElementById("btn-finalizar").disabled = false;
}

function actualizarCantidad(index, valor) {
  const nuevaCant = parseInt(valor);
  if (isNaN(nuevaCant) || nuevaCant < 1) return;
  ticket[index].cant = nuevaCant;
  ticket[index].sub = ticket[index].price * nuevaCant;
  let nuevoTotal = 0;
  ticket.forEach((i) => (nuevoTotal += i.sub));
  document.getElementById("ticket-total").innerText =
    "$" + nuevoTotal.toFixed(2);
  const fila = document.getElementById("ticket-items").children[index];
  fila.children[3].innerText = "$" + ticket[index].sub.toFixed(2);
}

function quitarDelTicket(index) {
  ticket.splice(index, 1);
  renderTicket();
}

function mostrarModalCobro() {
  let tot = 0;
  ticket.forEach((i) => (tot += i.sub));
  document.getElementById("modal-total-monto").innerText = "$" + tot.toFixed(2);
  new bootstrap.Modal(document.getElementById("modalCobro")).show();
}

// PERSISTENCIA DE VENTAS EN LA BASE DE DATOS REMOTA
async function liquidarVentaServidor() {
  let totalVenta = 0;
  ticket.forEach((i) => (totalVenta += i.sub));

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const payload = {
    total: totalVenta,
    operator: user.name || "Admin",
    payment: document.getElementById("modal-metodo-pago").value,
    items: ticket,
  };

  try {
    const res = await fetch("http://localhost:3000/api/ventas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      const modalElement = document.getElementById("modalCobro");
      bootstrap.Modal.getInstance(modalElement).hide();
      alert("✅ Operación completada. Venta guardada y stock descontado.");
      ticket = [];
      renderTicket();
      inicializarVentas(); // Recarga catálogos locales para reflejar el stock actual decrecido
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error crítico de comunicación con el servidor central.");
  }
}

// ==========================================================================
// GESTIÓN DEL MAESTRO DE STOCK (ABM INTEGRAL)
// ==========================================================================
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
        '<td class="text-center fw-bold">' +
        p.stock +
        "</td>" +
        '<td class="text-center">' +
        '<button type="button" class="me-2" onclick="prepararEdicion(' +
        p.id +
        ')" style="background: none; border: none; color: #00e5ff; cursor: pointer; font-size: 0.95rem;">✏️</button>' +
        '<button type="button" onclick="eliminarProductoBD(' +
        p.id +
        ", '" +
        p.code +
        '\')" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.95rem;">🗑️</button>' +
        "</td>" +
        "</tr>";
    });
  } catch (err) {
    console.error(err);
  }
}

function abrirModalProducto() {
  document.getElementById("form-producto").reset();
  document.getElementById("prod-id").value = "";
  let siguienteCodigo = "001";
  if (dbProductos.length > 0) {
    const codigosNumericos = dbProductos
      .map((p) => parseInt(p.code, 10))
      .filter((num) => !isNaN(num));
    if (codigosNumericos.length > 0) {
      siguienteCodigo = String(Math.max(...codigosNumericos) + 1).padStart(
        3,
        "0",
      );
    }
  }
  const inputCodigo = document.getElementById("prod-codigo");
  inputCodigo.value = siguienteCodigo;
  inputCodigo.readOnly = true;
  inputCodigo.classList.remove("text-info");
  inputCodigo.classList.add("text-muted");
  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

function prepararEdicion(id) {
  const p = dbProductos.find((x) => x.id === id);
  if (!p) return alert("No se encontraron los datos.");
  document.getElementById("prod-id").value = p.id;
  document.getElementById("prod-codigo").value = p.code;
  document.getElementById("prod-nombre").value = p.name;
  document.getElementById("prod-presentacion").value = p.presentation;
  document.getElementById("prod-precio").value = p.price;
  document.getElementById("prod-stock").value = p.stock;
  document.getElementById("prod-categoria").value = p.categoryId;
  const inputCodigo = document.getElementById("prod-codigo");
  inputCodigo.readOnly = true;
  inputCodigo.classList.remove("text-info");
  inputCodigo.classList.add("text-muted");
  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

async function guardarProductoBD(e) {
  e.preventDefault();
  const id = document.getElementById("prod-id").value;
  const productoData = {
    code: document.getElementById("prod-codigo").value.trim(),
    name: document.getElementById("prod-nombre").value.trim(),
    presentation: document.getElementById("prod-presentacion").value.trim(),
    price: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value),
    categoryId: parseInt(document.getElementById("prod-categoria").value),
  };
  const esEdicion = id !== "";
  const url = esEdicion
    ? "http://localhost:3000/api/productos/" + id
    : "http://localhost:3000/api/productos";
  try {
    const res = await fetch(url, {
      method: esEdicion ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(productoData),
    });
    if (res.ok) {
      bootstrap.Modal.getInstance(
        document.getElementById("modalProducto"),
      ).hide();
      alert("✅ Catálogo modificado con éxito.");
      inicializarVentas();
    }
  } catch (err) {
    console.error(err);
  }
}

async function eliminarProductoBD(id, code) {
  if (!confirm("⚠️ ¿Eliminar permanentemente [" + code + "]?")) return;
  try {
    const res = await fetch("http://localhost:3000/api/productos/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    if (res.ok) {
      alert("✅ Eliminado.");
      inicializarVentas();
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================================================
// MÓDULO ANALÍTICO: HISTORIAL Y REPORTES DE CIERRE DE CAJA (NUEVO)
// ==========================================================================
function inicializarHistorial() {
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("hist-fecha-inicio").value = hoy;
  document.getElementById("hist-fecha-fin").value = hoy;

  const selectProd = document.getElementById("hist-producto-select");
  selectProd.innerHTML = '<option value="">-- TODOS LOS ARTÍCULOS --</option>';
  dbProductos.forEach((p) => {
    selectProd.innerHTML += `<option value="${p.id}">[${p.code}] ${p.name.toUpperCase()}</option>`;
  });

  consultarHistorial();
}

async function consultarHistorial() {
  const fInicio = document.getElementById("hist-fecha-inicio").value;
  const fFin = document.getElementById("hist-fecha-fin").value;
  const pId = document.getElementById("hist-producto-select").value;

  let url = `http://localhost:3000/api/ventas/historial?fechaInicio=${fInicio}&fechaFin=${fFin}`;
  if (pId) url += `&productoId=${pId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const ventas = await res.json();
    renderHistorialTabla(ventas);
  } catch (err) {
    console.error("Error consultando historial:", err);
  }
}

function renderHistorialTabla(ventas) {
  const body = document.getElementById("tabla-historial-body");
  body.innerHTML = "";

  let totalGeneral = 0,
    totalEfe = 0,
    totalTar = 0,
    totalTra = 0;

  if (ventas.length === 0) {
    body.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3">No se registran ventas para el período seleccionado.</td></tr>';
    actualizarKpis(0, 0, 0, 0);
    return;
  }

  ventas.forEach((v) => {
    totalGeneral += v.total;
    if (v.payment === "EFECTIVO") totalEfe += v.total;
    if (v.payment === "TARJETA") totalTar += v.total;
    if (v.payment === "TRANSFERENCIA") totalTra += v.total;

    const desgloseItems = v.details
      .map((d) => `• ${d.product.name} (x${d.quantity})`)
      .join("<br>");
    const fechaFormateada = new Date(v.createdAt).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    body.innerHTML += `
      <tr class="align-middle">
        <td><span class="text-white fw-extrabold fs-6" style="letter-spacing: 0.5px;">${fechaFormateada}</span></td>
        <td><span class="badge bg-black text-info border border-secondary fw-bold px-2 py-1">${v.operator}</span></td>
        <td><span class="text-info fw-bold">${v.payment}</span></td>
        <td class="text-white fw-semibold">${desgloseItems}</td>
        <td class="text-end text-success fw-bold fs-5" style="text-shadow: 0 0 10px rgba(40, 167, 69, 0.2);">$${v.total.toFixed(2)}</td>
      </tr>
    `;
  });

  actualizarKpis(totalGeneral, totalEfe, totalTar, totalTra);
}

function actualizarKpis(general, efe, tar, tra) {
  document.getElementById("kpi-total-ventas").innerText =
    `$${general.toFixed(2)}`;
  document.getElementById("kpi-efectivo").innerText = `$${efe.toFixed(2)}`;
  document.getElementById("kpi-tarjeta").innerText = `$${tar.toFixed(2)}`;
  document.getElementById("kpi-transferencia").innerText = `$${tra.toFixed(2)}`;
}
