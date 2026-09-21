const SUPABASE_URL = "https://afvgjmobxkkcgtmuedqj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiYWZ2Z2ptb2J4a2tjZ3RtdWVkcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2MDMwMDI1MywiZXhwIjoyMDc1ODc2MjUzfQ.GXlKK0o4WYbJ-U2VHgCfSmJ7Sg4SxUgb_2-ivebVqcI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let products = [];
let stores = [];
let categories = [];
let deliveryZones = [];
let cart = [];


// ===============================
// LOAD EVERYTHING
// ===============================

async function loadMarketplace() {

  console.log("Loading marketplace...");

  await Promise.all([
    loadStores(),
    loadCategories(),
    loadProducts(),
    loadDeliveryZones()
  ]);

  renderProducts(products);
}


// ===============================
// STORES
// ===============================

async function loadStores() {

  const { data, error } = await supabaseClient
    .from("stores")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Stores error:", error);
    return;
  }

  stores = data || [];

  const container =
    document.getElementById("storesContainer");

  container.innerHTML = stores.map(store => `
    <div
      class="store-card"
      onclick="filterStore(${store.id})"
    >
      <h3>${escapeHTML(store.name)}</h3>
      <p>${escapeHTML(store.address || "")}</p>
    </div>
  `).join("");
}


// ===============================
// CATEGORIES
// ===============================

async function loadCategories() {

  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Categories error:", error);
    return;
  }

  categories = data || [];

  const container =
    document.getElementById("categoriesContainer");

  container.innerHTML = categories.map(category => `
    <div
      class="category-card"
      onclick="filterCategory(${category.id})"
    >
      ${escapeHTML(category.name)}
    </div>
  `).join("");
}


// ===============================
// PRODUCTS
// ===============================

async function loadProducts() {

  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      *,
      stores (
        name
      ),
      categories (
        name
      )
    `)
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Products error:", error);
    document.getElementById("productsContainer").innerHTML =
      "<p>Could not load products.</p>";
    return;
  }

  products = data || [];
}


// ===============================
// DELIVERY ZONES
// ===============================

async function loadDeliveryZones() {

  const { data, error } = await supabaseClient
    .from("delivery_zones")
    .select("*")
    .eq("active", true)
    .order("fee");

  if (error) {
    console.error("Delivery zones error:", error);
    return;
  }

  deliveryZones = data || [];

  const select =
    document.getElementById("deliveryZone");

  select.innerHTML =
    `<option value="">Select delivery area</option>` +
    deliveryZones.map(zone => `
      <option value="${zone.id}" data-fee="${zone.fee}">
        ${escapeHTML(zone.name)} — Rs. ${Number(zone.fee)}
      </option>
    `).join("");
}


// ===============================
// RENDER PRODUCTS
// ===============================

function renderProducts(list) {

  const container =
    document.getElementById("productsContainer");

  document.getElementById("productCount").textContent =
    `${list.length} products`;

  if (!list.length) {
    container.innerHTML =
      "<p>No products found.</p>";
    return;
  }

  container.innerHTML = list.map(product => {

    const image =
      product.image_url ||
      "https://placehold.co/600x400?text=Product";

    return `
      <div class="product-card">

        <img
          class="product-image"
          src="${image}"
          alt="${escapeHTML(product.name)}"
        >

        <div class="product-info">

          <h3>${escapeHTML(product.name)}</h3>

          <p>
            ${escapeHTML(product.stores?.name || "")}
          </p>

          <div class="price">
            Rs. ${Number(product.price).toLocaleString()}
          </div>

          <button
            class="add-button"
            onclick="addToCart(${product.id})"
          >
            Add to Cart
          </button>

        </div>

      </div>
    `;

  }).join("");
}


// ===============================
// SEARCH
// ===============================

document
  .getElementById("searchInput")
  .addEventListener("input", function () {

    const search =
      this.value.toLowerCase().trim();

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      (product.stores?.name || "")
        .toLowerCase()
        .includes(search)
    );

    renderProducts(filtered);
  });


// ===============================
// STORE FILTER
// ===============================

function filterStore(storeId) {

  const filtered =
    products.filter(product =>
      product.store_id === storeId
    );

  renderProducts(filtered);
}


// ===============================
// CATEGORY FILTER
// ===============================

function filterCategory(categoryId) {

  const filtered =
    products.filter(product =>
      product.category_id === categoryId
    );

  renderProducts(filtered);
}


// ===============================
// CART
// ===============================

function addToCart(productId) {

  const product =
    products.find(p => p.id === productId);

  if (!product) return;

  const existing =
    cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  updateCart();
}


function updateCart() {

  const count =
    cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

  document.getElementById("cartCount")
    .textContent = count;

  renderCart();
}


function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!cart.length) {

    container.innerHTML =
      "<p>Your cart is empty.</p>";

    updateTotals();

    return;
  }

  container.innerHTML =
    cart.map(item => `

      <div class="cart-item">

        <div>
          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <br>

          Rs. ${Number(item.price).toLocaleString()}
        </div>

        <div>

          <button
            onclick="changeQuantity(${item.id}, -1)"
          >
            −
          </button>

          ${item.quantity}

          <button
            onclick="changeQuantity(${item.id}, 1)"
          >
            +
          </button>

        </div>

      </div>

    `).join("");

  updateTotals();
}


function changeQuantity(productId, change) {

  const item =
    cart.find(item => item.id === productId);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart =
      cart.filter(item => item.id !== productId);
  }

  updateCart();
}


// ===============================
// TOTALS
// ===============================

function getSubtotal() {

  return cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );
}


function getDeliveryFee() {

  const select =
    document.getElementById("deliveryZone");

  const selected =
    select.options[select.selectedIndex];

  if (!selected) return 0;

  return Number(
    selected.dataset.fee || 0
  );
}


function updateTotals() {

  const subtotal =
    getSubtotal();

  const delivery =
    getDeliveryFee();

  const total =
    subtotal + delivery;

  document.getElementById("subtotal")
    .textContent =
    subtotal.toLocaleString();

  document.getElementById("deliveryFee")
    .textContent =
    delivery.toLocaleString();

  document.getElementById("grandTotal")
    .textContent =
    total.toLocaleString();

  document.getElementById("checkoutTotal")
    .textContent =
    total.toLocaleString();
}


// ===============================
// CART BUTTONS
// ===============================

document
  .getElementById("cartButton")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.add("open");

  });


document
  .getElementById("closeCart")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.remove("open");

  });


// ===============================
// CHECKOUT
// ===============================

document
  .getElementById("checkoutButton")
  .addEventListener("click", () => {

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    document
      .getElementById("checkoutModal")
      .classList.add("open");

  });


document
  .getElementById("closeCheckout")
  .addEventListener("click", () => {

    document
      .getElementById("checkoutModal")
      .classList.remove("open");

  });


document
  .getElementById("deliveryZone")
  .addEventListener("change", updateTotals);


// ===============================
// PLACE ORDER
// ===============================

document
  .getElementById("placeOrderButton")
  .addEventListener("click", placeOrder);


async function placeOrder() {

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const name =
    document.getElementById("customerName")
      .value.trim();

  const phone =
    document.getElementById("customerPhone")
      .value.trim();

  const address =
    document.getElementById("customerAddress")
      .value.trim();

  const zone =
    document.getElementById("deliveryZone")
      .value;

  const payment =
    document.getElementById("paymentMethod")
      .value;

  if (!name || !phone || !address || !zone) {
    alert("Please complete all delivery details.");
    return;
  }

  const subtotal = getSubtotal();
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;

  const selectedZone =
    deliveryZones.find(
      z => String(z.id) === String(zone)
    );

  /*
    For this first version we create the customer
    and order in Supabase.
  */

  const { data: customer, error: customerError } =
    await supabaseClient
      .from("customers")
      .insert({
        name,
        phone,
        address
      })
      .select()
      .single();

  if (customerError) {

    console.error(customerError);

    alert("Could not create customer record.");

    return;
  }


  /*
    This first version assumes the cart contains
    products from one store.

    We will improve multi-store carts later.
  */

  const storeId =
    cart[0].store_id;


  const { data: order, error: orderError } =
    await supabaseClient
      .from("orders")
      .insert({

        customer_id: customer.id,

        store_id: storeId,

        delivery_zone_id:
          selectedZone.id,

        customer_name: name,

        customer_phone: phone,

        customer_address: address,

        subtotal: subtotal,

        delivery_fee: delivery,

        total: total,

        payment_method: payment,

        payment_status:
          payment === "COD"
            ? "pending"
            : "pending",

        order_status: "pending"

      })
      .select()
      .single();


  if (orderError) {

    console.error(orderError);

    alert("Could not create order.");

    return;
  }


  /*
    Add products to order_items
  */

  const orderItems =
    cart.map(item => ({

      order_id: order.id,

      product_id: item.id,

      quantity: item.quantity,

      price: item.price

    }));


  const { error: itemsError } =
    await supabaseClient
      .from("order_items")
      .insert(orderItems);


  if (itemsError) {

    console.error(itemsError);

    alert("Order was created but products could not be added.");

    return;
  }


  /*
    WhatsApp message
  */

  const whatsappNumber =
    "923448343097";

  let message =
    `New Marketplace Order%0A%0A`;

  message +=
    `Order ID: ${order.id}%0A`;

  message +=
    `Customer: ${name}%0A`;

  message +=
    `Phone: ${phone}%0A`;

  message +=
    `Address: ${address}%0A%0A`;

  message +=
    `Items:%0A`;

  cart.forEach(item => {

    message +=
      `${item.name} x ${item.quantity} = Rs. ${
        Number(item.price) * item.quantity
      }%0A`;

  });

  message +=
    `%0ASubtotal: Rs. ${subtotal}`;

  message +=
    `%0ADelivery: Rs. ${delivery}`;

  message +=
    `%0ATotal: Rs. ${total}`;

  message +=
    `%0APayment: ${payment}`;


  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${message}`;


  window.open(
    whatsappURL,
    "_blank"
  );


  alert(
    `Order #${order.id} created successfully!`
  );


  cart = [];

  updateCart();

  document
    .getElementById("checkoutModal")
    .classList.remove("open");

}


// ===============================
// BASIC HTML SAFETY
// ===============================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ===============================
// START
// ===============================

loadMarketplace();