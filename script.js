// ============================================================
// CHAKSWARI MARKETPLACE
// Main JavaScript
// ============================================================

console.log("CHAKSWARI MARKETPLACE JS STARTED");

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL = "https://afvgjmobxkkcgtmuedqj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tUX83g_zIzdRFMARlTnr7A_XTIQrlZe";
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiYWZ2Z2ptb2J4a2tjZ3RtdWVkcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2MDMwMDI1MywiZXhwIjoyMDc1ODcyNjUzfQ.GXlKK0o4WYbJ-U2VHgCfSmJ7Sg4SxUgb_2-ivebVqcI";


// Check Supabase library
if (!window.supabase) {

  console.error("Supabase library did not load.");

  showPageError(
    "Supabase could not be loaded. Please refresh the page."
  );

  throw new Error("Supabase library missing.");

}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


// ============================================================
// APP DATA
// ============================================================

let stores = [];
let categories = [];
let products = [];
let deliveryZones = [];

let cart = [];


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log("DOM READY");

    setupButtons();

    loadMarketplace();

  }
);


// ============================================================
// LOAD MARKETPLACE
// ============================================================

async function loadMarketplace() {

  console.log("Loading marketplace...");

  try {

    setProductLoading();

    await Promise.all([
      loadStores(),
      loadCategories(),
      loadProducts(),
      loadDeliveryZones()
    ]);

    renderProducts(products);

    console.log("Marketplace loaded successfully.");

  }

  catch (error) {

    console.error(
      "Marketplace loading error:",
      error
    );

    showPageError(
      "We could not load the marketplace. Please refresh the page."
    );

  }

}


// ============================================================
// STORES
// ============================================================

async function loadStores() {

  console.log("Loading stores...");

  const {
    data,
    error
  } = await supabaseClient
    .from("stores")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {

    console.error(
      "Stores error:",
      error
    );

    throw error;

  }

  stores = data || [];

  const container =
    document.getElementById(
      "storesContainer"
    );

  if (!container) return;

  if (!stores.length) {

    container.innerHTML =
      `<div class="loading-card">
        No stores available.
      </div>`;

    return;

  }

  container.innerHTML =
    stores
      .map(
        store => `

          <div
            class="store-card"
            onclick="filterStore(${store.id})"
          >

            <h3>
              ${escapeHTML(store.name)}
            </h3>

            <p>
              ${escapeHTML(store.address || "")}
            </p>

          </div>

        `
      )
      .join("");

}


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

  console.log("Loading categories...");

  const {
    data,
    error
  } = await supabaseClient
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {

    console.error(
      "Categories error:",
      error
    );

    throw error;

  }

  categories = data || [];

  const container =
    document.getElementById(
      "categoriesContainer"
    );

  if (!container) return;

  if (!categories.length) {

    container.innerHTML =
      `<div class="loading-card">
        No categories available.
      </div>`;

    return;

  }

  container.innerHTML =
    categories
      .map(
        category => `

          <div
            class="category-card"
            onclick="filterCategory(${category.id})"
          >

            ${escapeHTML(category.name)}

          </div>

        `
      )
      .join("");

}


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {

  console.log("Loading products...");

  const {
    data,
    error
  } = await supabaseClient
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

    console.error(
      "Products error:",
      error
    );

    throw error;

  }

  products = data || [];

  console.log(
    "Products received:",
    products.length
  );

}


// ============================================================
// DELIVERY ZONES
// ============================================================

async function loadDeliveryZones() {

  console.log("Loading delivery zones...");

  const {
    data,
    error
  } = await supabaseClient
    .from("delivery_zones")
    .select("*")
    .eq("active", true)
    .order("fee");

  if (error) {

    console.error(
      "Delivery zones error:",
      error
    );

    throw error;

  }

  deliveryZones = data || [];

  const select =
    document.getElementById(
      "deliveryZone"
    );

  if (!select) return;

  select.innerHTML =
    `
      <option value="">
        Select delivery area
      </option>
    `;

  deliveryZones.forEach(
    zone => {

      const option =
        document.createElement("option");

      option.value = zone.id;

      option.dataset.fee =
        zone.fee;

      option.textContent =
        `${zone.name} — Rs. ${Number(zone.fee).toLocaleString()}`;

      select.appendChild(option);

    }
  );

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(list) {

  const container =
    document.getElementById(
      "productsContainer"
    );

  const count =
    document.getElementById(
      "productCount"
    );

  if (!container) return;

  if (count) {

    count.textContent =
      `${list.length} products`;

  }


  if (!list.length) {

    container.innerHTML =
      `
        <div class="loading-card">
          No products found.
        </div>
      `;

    return;

  }


  container.innerHTML =
    list
      .map(
        product => {

          const image =
            product.image_url ||
            "https://placehold.co/600x400?text=Product";


          return `

            <article
              class="product-card"
            >

              <img
                class="product-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                onerror="this.src='https://placehold.co/600x400?text=Product'"
              >

              <div class="product-info">

                <h3>
                  ${escapeHTML(product.name)}
                </h3>

                <p>
                  ${escapeHTML(
                    product.stores?.name || ""
                  )}
                </p>

                <div class="price">
                  Rs.
                  ${Number(product.price).toLocaleString()}
                </div>

                <button
                  class="add-button"
                  type="button"
                  onclick="addToCart(${product.id})"
                >
                  Add to Cart
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  if (!searchInput) return;


  searchInput.addEventListener(
    "input",
    () => {

      const search =
        searchInput.value
          .toLowerCase()
          .trim();


      const filtered =
        products.filter(
          product => {

            const productName =
              (
                product.name || ""
              ).toLowerCase();

            const storeName =
              (
                product.stores?.name || ""
              ).toLowerCase();

            return (
              productName.includes(search) ||
              storeName.includes(search)
            );

          }
        );


      renderProducts(filtered);

    }
  );

}


// ============================================================
// FILTER STORE
// ============================================================

function filterStore(storeId) {

  const filtered =
    products.filter(
      product =>
        Number(product.store_id) ===
        Number(storeId)
    );

  renderProducts(filtered);

  scrollToProducts();

}


// ============================================================
// FILTER CATEGORY
// ============================================================

function filterCategory(categoryId) {

  const filtered =
    products.filter(
      product =>
        Number(product.category_id) ===
        Number(categoryId)
    );

  renderProducts(filtered);

  scrollToProducts();

}


// ============================================================
// CART
// ============================================================

function addToCart(productId) {

  const product =
    products.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );

  if (!product) return;


  const existing =
    cart.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );


  if (existing) {

    existing.quantity++;

  }

  else {

    cart.push({

      ...product,

      quantity: 1

    });

  }


  updateCart();

  showToast(
    `${product.name} added to cart`
  );

}


function changeQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      product =>
        Number(product.id) ===
        Number(productId)
    );

  if (!item) return;


  item.quantity += change;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product =>
          Number(product.id) !==
          Number(productId)
      );

  }


  updateCart();

}


function updateCart() {

  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  const cartCount =
    document.getElementById(
      "cartCount"
    );

  if (cartCount) {

    cartCount.textContent =
      count;

  }


  renderCart();

}


function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!container) return;


  if (!cart.length) {

    container.innerHTML =
      `
        <p class="empty-message">
          Your cart is empty.
        </p>
      `;

    updateTotals();

    return;

  }


  container.innerHTML =
    cart
      .map(
        item => `

          <div class="cart-item">

            <div>

              <strong>
                ${escapeHTML(item.name)}
              </strong>

              <br>

              <small>
                Rs.
                ${Number(item.price).toLocaleString()}
              </small>

            </div>

            <div>

              <button
                type="button"
                onclick="changeQuantity(${item.id}, -1)"
              >
                −
              </button>

              ${item.quantity}

              <button
                type="button"
                onclick="changeQuantity(${item.id}, 1)"
              >
                +
              </button>

            </div>

          </div>

        `
      )
      .join("");


  updateTotals();

}


// ============================================================
// TOTALS
// ============================================================

function getSubtotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price) *
      item.quantity,
    0
  );

}


function getDeliveryFee() {

  const select =
    document.getElementById(
      "deliveryZone"
    );

  if (!select) return 0;


  const option =
    select.options[
      select.selectedIndex
    ];

  if (!option) return 0;


  return Number(
    option.dataset.fee || 0
  );

}


function updateTotals() {

  const subtotal =
    getSubtotal();

  const delivery =
    getDeliveryFee();

  const total =
    subtotal + delivery;


  const subtotalElement =
    document.getElementById(
      "subtotal"
    );

  const deliveryElement =
    document.getElementById(
      "deliveryFee"
    );

  const totalElement =
    document.getElementById(
      "grandTotal"
    );

  const checkoutElement =
    document.getElementById(
      "checkoutTotal"
    );


  if (subtotalElement) {

    subtotalElement.textContent =
      subtotal.toLocaleString();

  }

  if (deliveryElement) {

    deliveryElement.textContent =
      delivery.toLocaleString();

  }

  if (totalElement) {

    totalElement.textContent =
      total.toLocaleString();

  }

  if (checkoutElement) {

    checkoutElement.textContent =
      total.toLocaleString();

  }

}


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

  setupSearch();


  const cartButton =
    document.getElementById(
      "cartButton"
    );

  const closeCart =
    document.getElementById(
      "closeCart"
    );

  const checkoutButton =
    document.getElementById(
      "checkoutButton"
    );

  const closeCheckout =
    document.getElementById(
      "closeCheckout"
    );

  const placeOrderButton =
    document.getElementById(
      "placeOrderButton"
    );

  const deliveryZone =
    document.getElementById(
      "deliveryZone"
    );

  const cartOverlay =
    document.getElementById(
      "cartOverlay"
    );

  const checkoutOverlay =
    document.getElementById(
      "checkoutOverlay"
    );


  if (cartButton) {

    cartButton.addEventListener(
      "click",
      openCart
    );

  }


  if (closeCart) {

    closeCart.addEventListener(
      "click",
      closeCartPanel
    );

  }


  if (cartOverlay) {

    cartOverlay.addEventListener(
      "click",
      closeCartPanel
    );

  }


  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      openCheckout
    );

  }


  if (closeCheckout) {

    closeCheckout.addEventListener(
      "click",
      closeCheckoutModal
    );

  }


  if (checkoutOverlay) {

    checkoutOverlay.addEventListener(
      "click",
      closeCheckoutModal
    );

  }


  if (placeOrderButton) {

    placeOrderButton.addEventListener(
      "click",
      placeOrder
    );

  }


  if (deliveryZone) {

    deliveryZone.addEventListener(
      "change",
      updateTotals
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeCartPanel();

        closeCheckoutModal();

      }

    }
  );

}


// ============================================================
// CART PANEL
// ============================================================

function openCart() {

  const panel =
    document.getElementById(
      "cartPanel"
    );

  const overlay =
    document.getElementById(
      "cartOverlay"
    );


  if (panel) {

    panel.classList.add("open");

  }

  if (overlay) {

    overlay.classList.add("open");

  }

}


function closeCartPanel() {

  const panel =
    document.getElementById(
      "cartPanel"
    );

  const overlay =
    document.getElementById(
      "cartOverlay"
    );


  if (panel) {

    panel.classList.remove("open");

  }

  if (overlay) {

    overlay.classList.remove("open");

  }

}


// ============================================================
// CHECKOUT
// ============================================================

function openCheckout() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }


  const modal =
    document.getElementById(
      "checkoutModal"
    );

  const overlay =
    document.getElementById(
      "checkoutOverlay"
    );


  if (modal) {

    modal.classList.add("open");

  }

  if (overlay) {

    overlay.classList.add("open");

  }

  updateTotals();

}


function closeCheckoutModal() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  const overlay =
    document.getElementById(
      "checkoutOverlay"
    );


  if (modal) {

    modal.classList.remove("open");

  }

  if (overlay) {

    overlay.classList.remove("open");

  }

}


// ============================================================
// PLACE ORDER
// ============================================================

async function placeOrder() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }


  const name =
    document.getElementById(
      "customerName"
    ).value.trim();

  const phone =
    document.getElementById(
      "customerPhone"
    ).value.trim();

  const address =
    document.getElementById(
      "customerAddress"
    ).value.trim();

  const zone =
    document.getElementById(
      "deliveryZone"
    ).value;

  const payment =
    document.getElementById(
      "paymentMethod"
    ).value;


  if (
    !name ||
    !phone ||
    !address ||
    !zone
  ) {

    showToast(
      "Please complete all delivery details."
    );

    return;

  }


  const subtotal =
    getSubtotal();

  const delivery =
    getDeliveryFee();

  const total =
    subtotal + delivery;


  const selectedZone =
    deliveryZones.find(
      item =>
        String(item.id) ===
        String(zone)
    );


  if (!selectedZone) {

    showToast(
      "Please select a delivery area."
    );

    return;

  }


  const placeButton =
    document.getElementById(
      "placeOrderButton"
    );

  if (placeButton) {

    placeButton.disabled = true;

    placeButton.textContent =
      "Creating Order...";

  }


  try {

    // --------------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------------

    const {
      data: customer,
      error: customerError
    } =
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

      throw customerError;

    }


    // --------------------------------------------------------
    // STORE
    // --------------------------------------------------------

    const storeId =
      cart[0].store_id;


    // --------------------------------------------------------
    // ORDER
    // --------------------------------------------------------

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from("orders")
        .insert({

          customer_id:
            customer.id,

          store_id:
            storeId,

          delivery_zone_id:
            selectedZone.id,

          customer_name:
            name,

          customer_phone:
            phone,

          customer_address:
            address,

          subtotal,

          delivery_fee:
            delivery,

          total,

          payment_method:
            payment,

          payment_status:
            "pending",

          order_status:
            "pending"

        })
        .select()
        .single();


    if (orderError) {

      throw orderError;

    }


    // --------------------------------------------------------
    // ORDER ITEMS
    // --------------------------------------------------------

    const orderItems =
      cart.map(
        item => ({

          order_id:
            order.id,

          product_id:
            item.id,

          quantity:
            item.quantity,

          price:
            item.price

        })
      );


    const {
      error: itemsError
    } =
      await supabaseClient
        .from("order_items")
        .insert(
          orderItems
        );


    if (itemsError) {

      throw itemsError;

    }


    // --------------------------------------------------------
    // WHATSAPP
    // --------------------------------------------------------

    const whatsappNumber =
      "923448343097";


    let message =
      `New Chakswari Marketplace Order\n\n`;

    message +=
      `Order ID: ${order.id}\n`;

    message +=
      `Customer: ${name}\n`;

    message +=
      `Phone: ${phone}\n`;

    message +=
      `Address: ${address}\n`;

    message +=
      `Delivery Area: ${selectedZone.name}\n\n`;

    message +=
      `Items:\n`;


    cart.forEach(
      item => {

        message +=
          `${item.name} x ${item.quantity} = Rs. ${
            Number(item.price) *
            item.quantity
          }\n`;

      }
    );


    message +=
      `\nSubtotal: Rs. ${subtotal}`;

    message +=
      `\nDelivery: Rs. ${delivery}`;

    message +=
      `\nTotal: Rs. ${total}`;

    message +=
      `\nPayment: ${payment}`;


    const whatsappURL =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


    window.open(
      whatsappURL,
      "_blank"
    );


    showToast(
      `Order #${order.id} created successfully`
    );


    cart = [];

    updateCart();

    closeCheckoutModal();

    closeCartPanel();


  }

  catch (error) {

    console.error(
      "Order error:",
      error
    );


    showToast(
      "Could not place the order. Check the Console for details."
    );

  }


  finally {

    if (placeButton) {

      placeButton.disabled = false;

      placeButton.textContent =
        "Place Order";

    }

  }

}


// ============================================================
// HELPERS
// ============================================================

function setProductLoading() {

  const container =
    document.getElementById(
      "productsContainer"
    );

  if (!container) return;

  container.innerHTML =
    `
      <div class="loading-card">
        Loading products...
      </div>
    `;

}


function showPageError(message) {

  const container =
    document.getElementById(
      "productsContainer"
    );

  if (!container) return;

  container.innerHTML =
    `
      <div class="loading-card">

        <strong>
          Something went wrong
        </strong>

        <p style="margin-top:8px;">
          ${escapeHTML(message)}
        </p>

      </div>
    `;

}


function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) return;


  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2500
  );

}


function scrollToProducts() {

  const section =
    document.getElementById(
      "productsContainer"
    );

  if (!section) return;


  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
