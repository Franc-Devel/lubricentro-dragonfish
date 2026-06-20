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

  document
    .getElementById("btn-confirmar-pago")
    .addEventListener("click", () => {
      const modalElement = document.getElementById("modalCobro");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
      alert("✅ Operación procesada. Comprobante emitido correctamente.");
      ticket = [];
      renderTicket();
    });

  // Manejo del Submit del Formulario ABM de Productos
  document
    .getElementById("form-producto")
    .addEventListener("submit", guardarProductoBD);

  // CONTROL DE TECLADO PARA EL BUSCADOR RÁPIDO
  const inputFiltrar = document.getElementById("input-filtrar-venta");
  inputFiltrar.addEventListener("input", filtrarSelectVentas);

  inputFiltrar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // ◄ Evita que se agregue el producto de forma automática al presionar Enter

      const select = document.getElementById("venta-producto-select");
      select.focus(); // ◄ Pone el foco en el selector para interactuar directamente

      // Simula la apertura visual expandiendo temporalmente el tamaño si tiene opciones válidas
      if (select.options.length > 1) {
        select.size = select.options.length;
      }
    }
  });

  // Devuelve el selector a su estado normal de dropdown cuando pierde el foco o se selecciona un ítem
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
    document.getElementById("input-filtrar-venta").focus(); // Mantiene el foco en el buscador para rapidez
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
        ')" style="background: none; border: none; color: #00e5ff; cursor: pointer; font-size: 0.95rem;" title="Editar">✏️</button>' +
        '<button type="button" onclick="eliminarProductoBD(' +
        p.id +
        ", '" +
        p.code +
        '\')" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.95rem;" title="Eliminar">🗑️</button>' +
        "</td>" +
        "</tr>";
    });
  } catch (err) {
    console.error("Error en grilla maestro:", err);
  }
}

// Abre el modal vacío para dar de alta un producto nuevo
function abrirModalProducto() {
  document.getElementById("form-producto").reset();
  document.getElementById("prod-id").value = ""; // Limpiamos ID

  // ALTA: El código único SÍ se puede definir
  const inputCodigo = document.getElementById("prod-codigo");
  inputCodigo.readOnly = false;
  inputCodigo.classList.remove("text-muted");
  inputCodigo.classList.add("text-info");

  document.getElementById("modalProductoTitle").innerText =
    "📥 REGISTRAR NUEVO ARTÍCULO";
  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

// Busca el producto localmente, rellena el formulario y abre el modal para editar
function prepararEdicion(id) {
  const p = dbProductos.find((x) => x.id === id);
  if (!p) return alert("No se encontraron los datos del producto.");

  document.getElementById("prod-id").value = p.id;
  document.getElementById("prod-codigo").value = p.code;
  document.getElementById("prod-nombre").value = p.name;
  document.getElementById("prod-presentacion").value = p.presentation;
  document.getElementById("prod-precio").value = p.price;
  document.getElementById("prod-stock").value = p.stock;
  document.getElementById("prod-categoria").value = p.categoryId;

  // EDICIÓN: El código único NO se puede modificar (Solo lectura)
  const inputCodigo = document.getElementById("prod-codigo");
  inputCodigo.readOnly = true;
  inputCodigo.classList.remove("text-info");
  inputCodigo.classList.add("text-muted");

  document.getElementById("modalProductoTitle").innerText =
    "✏️ MODIFICAR ARTÍCULO: [" + p.code + "]";
  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

// Envía la petición al backend (POST para crear / PUT para actualizar)
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
  const metodo = esEdicion ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(productoData),
    });

    if (res.ok) {
      const modalElement = document.getElementById("modalProducto");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();

      alert(
        esEdicion
          ? "✅ Artículo actualizado correctamente."
          : "✅ Nuevo artículo guardado de forma exitosa.",
      );

      inicializarVentas();
    } else {
      const data = await res.json();
      alert("❌ Error: " + (data.error || "No se pudo procesar la solicitud."));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error crítico de conexión con el servidor central.");
  }
}

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
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (res.ok) {
      alert("✅ Artículo eliminado de la base de datos.");
      inicializarVentas();
    } else {
      const data = await res.json();
      alert("❌ Error: " + (data.error || "No se pudo eliminar el artículo."));
    }
  } catch (err) {
    console.error(err);
  }
}
