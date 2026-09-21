// ============================================================
// CHAKSWARI MARKETPLACE
// Main JavaScript
// ============================================================

console.log("CHAKSWARI MARKETPLACE JS STARTED");

const SUPABASE_URL =
  "https://afvgjmobxkkcgtmuedqj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_tUX83g_zIzdRFMARlTnr7A_XTIQrlZe";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

console.log("Supabase client created");


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let stores = [];
let categories = [];
let products = [];
let deliveryZones = [];

let cart = [];

let selectedStore = null;
let selectedCategory = null;
let searchTerm = "";


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM READY");

  loadMarketplace();

  setupButtons();

});


// ============================================================
// LOAD MARKETPLACE
// ============================================================

async function loadMarketplace() {

  console.log("Loading marketplace...");

  await Promise.allSettled([

    loadStores(),

    loadCategories(),

    loadProducts(),

    loadDeliveryZones()

  ]);

  console.log("Marketplace loading completed");

  renderStores();

  renderCategories();

  renderProducts();

  updateCartUI();

}


// ============================================================
// LOAD STORES
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

    stores = [];

    return;

  }

  stores = data || [];

  console.log(
    "Stores received:",
    stores.length
  );

}


// ============================================================
// LOAD CATEGORIES
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

    categories = [];

    return;

  }

  categories = data || [];

  console.log(
    "Categories received:",
    categories.length
  );

}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

  console.log("Loading products...");

  const {
    data,
    error
  } = await supabaseClient
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {

    console.error(
      "Products error:",
      error
    );

    products = [];

    return;

  }

  products = data || [];

  console.log(
    "Products received:",
    products.length
  );

}


// ============================================================
// LOAD DELIVERY ZONES
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
    .order("delivery_fee", {
      ascending: true
    });

  if (error) {

    console.error(
      "Delivery zones error:",
      error
    );

    deliveryZones = [];

    const select =
      document.getElementById(
        "deliveryZone"
      );

    if (select) {

      select.innerHTML = `
        <option value="">
          Delivery area unavailable
        </option>
      `;

    }

    updateTotals();

    return;

  }

  deliveryZones = data || [];

  console.log(
    "Delivery zones received:",
    deliveryZones.length
  );

  const select =
    document.getElementById(
      "deliveryZone"
    );

  if (!select) {

    console.error(
      "Delivery zone dropdown not found."
    );

    return;

  }

  select.innerHTML = `
    <option value="">
      Select delivery area
    </option>
  `;

  deliveryZones.forEach(zone => {

    const option =
      document.createElement(
        "option"
      );

    option.value = zone.id;

    option.dataset.fee =
      Number(
        zone.delivery_fee || 0
      );

    option.textContent =
      `${zone.name} — Rs. ${Number(
        zone.delivery_fee || 0
      ).toLocaleString()}`;

    select.appendChild(option);

  });

  updateTotals();

}


// ============================================================
// RENDER STORES
// ============================================================

function renderStores() {

  const container =
    document.getElementById(
      "storesContainer"
    );

  if (!container) {

    return;

  }

  container.innerHTML = "";

  if (!stores.length) {

    container.innerHTML = `
      <div class="empty-state">
        <p>No stores available.</p>
      </div>
    `;

    return;

  }

  stores.forEach(store => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "store-card";

    card.dataset.storeId =
      store.id;

    card.innerHTML = `
      <div class="store-image">
        ${
          store.image_url
            ? `<img src="${store.image_url}" alt="${escapeHTML(store.name)}">`
            : `<div class="store-placeholder">🏪</div>`
        }
      </div>

      <div class="store-content">

        <h3>
          ${escapeHTML(store.name)}
        </h3>

        <p>
          ${escapeHTML(
            store.description || ""
          )}
        </p>

        ${
          store.address
            ? `
              <small>
                ${escapeHTML(
                  store.address
                )}
              </small>
            `
            : ""
        }

      </div>
    `;

    card.addEventListener(
      "click",
      () => {

        selectedStore =
          store.id;

        renderProducts();

        scrollToProducts();

      }
    );

    container.appendChild(
      card
    );

  });

}


// ============================================================
// RENDER CATEGORIES
// ============================================================

function renderCategories() {

  const container =
    document.getElementById(
      "categoriesContainer"
    );

  if (!container) {

    return;

  }

  container.innerHTML = "";

  if (!categories.length) {

    return;

  }

  const allButton =
    document.createElement(
      "button"
    );

  allButton.className =
    "category-button active";

  allButton.textContent =
    "All";

  allButton.addEventListener(
    "click",
    () => {

      selectedCategory =
        null;

      updateCategoryButtons();

      renderProducts();

    }
  );

  container.appendChild(
    allButton
  );

  categories.forEach(category => {

    const button =
      document.createElement(
        "button"
      );

    button.className =
      "category-button";

    button.dataset.categoryId =
      category.id;

    button.textContent =
      category.name;

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          category.id;

        updateCategoryButtons();

        renderProducts();

      }
    );

    container.appendChild(
      button
    );

  });

}


// ============================================================
// UPDATE CATEGORY BUTTONS
// ============================================================

function updateCategoryButtons() {

  const buttons =
    document.querySelectorAll(
      ".category-button"
    );

  buttons.forEach(
    button => {

      const id =
        button.dataset.categoryId;

      if (
        (!selectedCategory &&
          !id) ||
        (
          selectedCategory &&
          id ===
            String(
              selectedCategory
            )
        )
      ) {

        button.classList.add(
          "active"
        );

      } else {

        button.classList.remove(
          "active"
        );

      }

    }
  );

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts() {

  const container =
    document.getElementById(
      "productsContainer"
    );

  const count =
    document.getElementById(
      "productCount"
    );

  if (!container) {

    return;

  }

  let filtered =
    [...products];

  if (selectedStore) {

    filtered =
      filtered.filter(
        product =>
          String(
            product.store_id
          ) ===
          String(
            selectedStore
          )
      );

  }

  if (selectedCategory) {

    filtered =
      filtered.filter(
        product =>
          String(
            product.category_id
          ) ===
          String(
            selectedCategory
          )
      );

  }

  if (searchTerm) {

    const term =
      searchTerm.toLowerCase();

    filtered =
      filtered.filter(
        product => {

          const name =
            (
              product.name ||
              ""
            ).toLowerCase();

          const description =
            (
              product.description ||
              ""
            ).toLowerCase();

          return (
            name.includes(term) ||
            description.includes(term)
          );

        }
      );

  }

  if (count) {

    count.textContent =
      `${filtered.length} product${
        filtered.length === 1
          ? ""
          : "s"
      }`;

  }

  container.innerHTML = "";

  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>
          Try another category or search.
        </p>
      </div>
    `;

    return;

  }

  filtered.forEach(
    product => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "product-card";

      const price =
        Number(
          product.price || 0
        );

      card.innerHTML = `
        <div class="product-image">

          ${
            product.image_url
              ? `
                <img
                  src="${product.image_url}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                >
              `
              : `
                <div class="product-placeholder">
                  🍽️
                </div>
              `
          }

        </div>

        <div class="product-content">

          <h3>
            ${escapeHTML(
              product.name
            )}
          </h3>

          <p class="product-description">
            ${escapeHTML(
              product.description || ""
            )}
          </p>

          <div class="product-bottom">

            <strong>
              Rs. ${price.toLocaleString()}
            </strong>

            <button
              class="add-to-cart"
              data-product-id="${product.id}"
            >
              Add
            </button>

          </div>

        </div>
      `;

      const addButton =
        card.querySelector(
          ".add-to-cart"
        );

      addButton.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          addToCart(product);

        }
      );

      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

  const input =
    document.getElementById(
      "searchInput"
    );

  if (!input) {

    return;

  }

  input.addEventListener(
    "input",
    event => {

      searchTerm =
        event.target.value
          .trim();

      renderProducts();

    }
  );

}


// ============================================================
// BUTTON SETUP
// ============================================================

function setupButtons() {

  console.log(
    "Setting up buttons..."
  );

  setupSearch();

  const cartButton =
    document.getElementById(
      "cartButton"
    );

  if (cartButton) {

    cartButton.addEventListener(
      "click",
      openCart
    );

  }

  const closeCart =
    document.getElementById(
      "closeCart"
    );

  if (closeCart) {

    closeCart.addEventListener(
      "click",
      closeCartPanel
    );

  }

  const checkoutButton =
    document.getElementById(
      "checkoutButton"
    );

  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      openCheckout
    );

  }

  const closeCheckout =
    document.getElementById(
      "closeCheckout"
    );

  if (closeCheckout) {

    closeCheckout.addEventListener(
      "click",
      closeCheckoutModal
    );

  }

  const placeOrderButton =
    document.getElementById(
      "placeOrderButton"
    );

  if (placeOrderButton) {

    placeOrderButton.addEventListener(
      "click",
      placeOrder
    );

  }

  const deliveryZone =
    document.getElementById(
      "deliveryZone"
    );

  if (deliveryZone) {

    deliveryZone.addEventListener(
      "change",
      updateTotals
    );

  }

}


// ============================================================
// ADD TO CART
// ============================================================

function addToCart(product) {

  if (!product) {

    return;

  }

  if (
    cart.length &&
    String(
      cart[0].store_id
    ) !==
    String(
      product.store_id
    )
  ) {

    showToast(
      "Please order from one store at a time."
    );

    return;

  }

  const existing =
    cart.find(
      item =>
        String(
          item.id
        ) ===
        String(
          product.id
        )
    );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }

  updateCartUI();

  showToast(
    `${product.name} added to cart`
  );

}


// ============================================================
// REMOVE FROM CART
// ============================================================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      item =>
        String(
          item.id
        ) !==
        String(
          productId
        )
    );

  updateCartUI();

}


// ============================================================
// CHANGE QUANTITY
// ============================================================

function changeQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      product =>
        String(
          product.id
        ) ===
        String(
          productId
        )
    );

  if (!item) {

    return;

  }

  item.quantity += change;

  if (
    item.quantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;

  }

  updateCartUI();

}


// ============================================================
// CART SUBTOTAL
// ============================================================

function getSubtotal() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 0
        )
      );

    },
    0
  );

}


// ============================================================
// DELIVERY FEE
// ============================================================

function getDeliveryFee() {

  const select =
    document.getElementById(
      "deliveryZone"
    );

  if (!select) {

    return 0;

  }

  const option =
    select.options[
      select.selectedIndex
    ];

  if (!option) {

    return 0;

  }

  return Number(
    option.dataset.fee || 0
  );

}


// ============================================================
// UPDATE TOTALS
// ============================================================

function updateTotals() {

  const subtotal =
    getSubtotal();

  const deliveryFee =
    getDeliveryFee();

  const total =
    subtotal +
    deliveryFee;

  const subtotalElement =
    document.getElementById(
      "subtotal"
    );

  const deliveryElement =
    document.getElementById(
      "deliveryFee"
    );

  const grandElement =
    document.getElementById(
      "grandTotal"
    );

  const checkoutTotal =
    document.getElementById(
      "checkoutTotal"
    );

  if (subtotalElement) {

    subtotalElement.textContent =
      `Rs. ${subtotal.toLocaleString()}`;

  }

  if (deliveryElement) {

    deliveryElement.textContent =
      `Rs. ${deliveryFee.toLocaleString()}`;

  }

  if (grandElement) {

    grandElement.textContent =
      `Rs. ${total.toLocaleString()}`;

  }

  if (checkoutTotal) {

    checkoutTotal.textContent =
      `Rs. ${total.toLocaleString()}`;

  }

}


// ============================================================
// UPDATE CART UI
// ============================================================

function updateCartUI() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!container) {

    return;

  }

  container.innerHTML = "";

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty.</p>
        <button
          type="button"
          onclick="closeCartPanel()"
        >
          Continue Shopping
        </button>
      </div>
    `;

    updateTotals();

    updateCartCount();

    return;

  }

  cart.forEach(
    item => {

      const quantity =
        Number(
          item.quantity || 1
        );

      const price =
        Number(
          item.price || 0
        );

      const itemTotal =
        price *
        quantity;

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "cart-item";

      element.innerHTML = `
        <div class="cart-item-info">

          <h4>
            ${escapeHTML(
              item.name
            )}
          </h4>

          <p>
            Rs. ${price.toLocaleString()}
          </p>

        </div>

        <div class="cart-item-actions">

          <button
            type="button"
            class="qty-button"
            data-action="minus"
            data-id="${item.id}"
          >
            −
          </button>

          <span>
            ${quantity}
          </span>

          <button
            type="button"
            class="qty-button"
            data-action="plus"
            data-id="${item.id}"
          >
            +
          </button>

        </div>

        <div class="cart-item-total">

          Rs. ${itemTotal.toLocaleString()}

        </div>

        <button
          type="button"
          class="remove-item"
          data-id="${item.id}"
        >
          Remove
        </button>
      `;

      const minus =
        element.querySelector(
          '[data-action="minus"]'
        );

      const plus =
        element.querySelector(
          '[data-action="plus"]'
        );

      const remove =
        element.querySelector(
          ".remove-item"
        );

      minus.addEventListener(
        "click",
        () => {

          changeQuantity(
            item.id,
            -1
          );

        }
      );

      plus.addEventListener(
        "click",
        () => {

          changeQuantity(
            item.id,
            1
          );

        }
      );

      remove.addEventListener(
        "click",
        () => {

          removeFromCart(
            item.id
          );

        }
      );

      container.appendChild(
        element
      );

    }
  );

  updateTotals();

  updateCartCount();

}


// ============================================================
// CART COUNT
// ============================================================

function updateCartCount() {

  const count =
    cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  const elements =
    document.querySelectorAll(
      ".cart-count"
    );

  elements.forEach(
    element => {

      element.textContent =
        count;

      element.style.display =
        count > 0
          ? "flex"
          : "none";

    }
  );

}


// ============================================================
// OPEN CART
// ============================================================

function openCart() {

  const overlay =
    document.getElementById(
      "cartOverlay"
    );

  if (!overlay) {

    return;

  }

  overlay.classList.add(
    "active"
  );

  updateCartUI();

}


// ============================================================
// CLOSE CART
// ============================================================

function closeCartPanel() {

  const overlay =
    document.getElementById(
      "cartOverlay"
    );

  if (!overlay) {

    return;

  }

  overlay.classList.remove(
    "active"
  );

}


// ============================================================
// OPEN CHECKOUT
// ============================================================

function openCheckout() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }

  const overlay =
    document.getElementById(
      "checkoutOverlay"
    );

  if (!overlay) {

    return;

  }

  updateTotals();

  overlay.classList.add(
    "active"
  );

}


// ============================================================
// CLOSE CHECKOUT
// ============================================================

function closeCheckoutModal() {

  const overlay =
    document.getElementById(
      "checkoutOverlay"
    );

  if (!overlay) {

    return;

  }

  overlay.classList.remove(
    "active"
  );

}


// ============================================================
// SCROLL TO PRODUCTS
// ============================================================

function scrollToProducts() {

  const section =
    document.getElementById(
      "productsContainer"
    );

  if (!section) {

    return;

  }

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


// ============================================================
// TOAST
// ============================================================

function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) {

    return;

  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2500
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
  value
) {

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


// ============================================================
// CHECKOUT FORM
// ============================================================

async function placeOrder() {

  console.log(
    "Place order clicked"
  );

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }

  const nameInput =
    document.getElementById(
      "customerName"
    );

  const phoneInput =
    document.getElementById(
      "customerPhone"
    );

  const addressInput =
    document.getElementById(
      "customerAddress"
    );

  const zoneInput =
    document.getElementById(
      "deliveryZone"
    );

  const paymentInput =
    document.getElementById(
      "paymentMethod"
    );

  const name =
    nameInput
      ? nameInput.value.trim()
      : "";

  const phone =
    phoneInput
      ? phoneInput.value.trim()
      : "";

  const address =
    addressInput
      ? addressInput.value.trim()
      : "";

  const zoneId =
    zoneInput
      ? zoneInput.value
      : "";

  const paymentMethod =
    paymentInput
      ? paymentInput.value
      : "";

  if (!name) {

    showToast(
      "Please enter your name."
    );

    return;

  }

  if (!phone) {

    showToast(
      "Please enter your phone number."
    );

    return;

  }

  if (!address) {

    showToast(
      "Please enter your address."
    );

    return;

  }

  if (!zoneId) {

    showToast(
      "Please select your delivery area."
    );

    return;

  }

  if (!paymentMethod) {

    showToast(
      "Please select a payment method."
    );

    return;

  }

  const storeId =
    cart[0].store_id;

  const subtotal =
    getSubtotal();

  const deliveryFee =
    getDeliveryFee();

  const total =
    subtotal +
    deliveryFee;

  const selectedZone =
    deliveryZones.find(
      zone =>
        String(
          zone.id
        ) ===
        String(
          zoneId
        )
    );

  const store =
    stores.find(
      item =>
        String(
          item.id
        ) ===
        String(
          storeId
        )
    );

  const orderButton =
    document.getElementById(
      "placeOrderButton"
    );

  if (orderButton) {

    orderButton.disabled =
      true;

    orderButton.textContent =
      "Placing Order...";

  }

  try {

    // --------------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------------

    const {
      data: customer,
      error: customerError
    } = await supabaseClient
      .from("customers")
      .insert({
        name,
        phone,
        address
      })
      .select()
      .single();

    if (customerError) {

      console.error(
        "Customer insert error:",
        customerError
      );

      throw customerError;

    }

    // --------------------------------------------------------
    // ORDER
    // --------------------------------------------------------

    const {
      data: order,
      error: orderError
    } = await supabaseClient
      .from("orders")
      .insert({

        customer_id:
          customer.id,

        store_id:
          storeId,

        delivery_zone_id:
          zoneId,

        subtotal:
          subtotal,

        delivery_fee:
          deliveryFee,

        total:
          total,

        payment_method:
          paymentMethod,

        customer_name:
          name,

        customer_phone:
          phone,

        customer_address:
          address,

        status:
          "pending"

      })
      .select()
      .single();

    if (orderError) {

      console.error(
        "Order insert error:",
        orderError
      );

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

          product_name:
            item.name,

          quantity:
            Number(
              item.quantity
            ),

          unit_price:
            Number(
              item.price
            ),

          total_price:
            Number(
              item.price
            ) *
            Number(
              item.quantity
            )

        })
      );

    const {
      error: itemsError
    } = await supabaseClient
      .from("order_items")
      .insert(
        orderItems
      );

    if (itemsError) {

      console.error(
        "Order items insert error:",
        itemsError
      );

      throw itemsError;

    }

    // --------------------------------------------------------
    // WHATSAPP MESSAGE
    // --------------------------------------------------------

    const message =
      createWhatsAppMessage({

        order,

        store,

        customer,

        selectedZone,

        paymentMethod,

        subtotal,

        deliveryFee,

        total

      });

    const whatsappNumber =
      "923448343097";

    const whatsappURL =
      `https://wa.me/${whatsappNumber}?text=${
        encodeURIComponent(
          message
        )
      }`;

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    showToast(
      "Order placed successfully!"
    );

    cart = [];

    updateCartUI();

    closeCheckoutModal();

    closeCartPanel();

    clearCheckoutForm();

    setTimeout(
      () => {

        window.open(
          whatsappURL,
          "_blank"
        );

      },
      500
    );

  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );

    showToast(
      "Unable to place order. Please try again."
    );

  } finally {

    if (orderButton) {

      orderButton.disabled =
        false;

      orderButton.textContent =
        "Place Order";

    }

  }

}


// ============================================================
// CREATE WHATSAPP MESSAGE
// ============================================================

function createWhatsAppMessage(
  data
) {

  const {
    order,
    store,
    customer,
    selectedZone,
    paymentMethod,
    subtotal,
    deliveryFee,
    total
  } = data;

  let message = "";

  message +=
    `🛒 *NEW CHAKSWARI MARKETPLACE ORDER*\n\n`;

  message +=
    `Order ID: ${order.id}\n`;

  message +=
    `Store: ${
      store
        ? store.name
        : "N/A"
    }\n\n`;

  message +=
    `*CUSTOMER DETAILS*\n`;

  message +=
    `Name: ${customer.name}\n`;

  message +=
    `Phone: ${customer.phone}\n`;

  message +=
    `Address: ${customer.address}\n`;

  message +=
    `Delivery Area: ${
      selectedZone
        ? selectedZone.name
        : "N/A"
    }\n\n`;

  message +=
    `*ORDER ITEMS*\n`;

  cart.forEach(
    item => {

      const itemTotal =
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 0
        );

      message +=
        `• ${item.name} × ${
          item.quantity
        } = Rs. ${
          itemTotal.toLocaleString()
        }\n`;

    }
  );

  message +=
    `\nSubtotal: Rs. ${
      subtotal.toLocaleString()
    }\n`;

  message +=
    `Delivery: Rs. ${
      deliveryFee.toLocaleString()
    }\n`;

  message +=
    `Total: Rs. ${
      total.toLocaleString()
    }\n`;

  message +=
    `Payment: ${paymentMethod}\n\n`;

  message +=
    `Please confirm this order.`;

  return message;

}


// ============================================================
// CLEAR CHECKOUT FORM
// ============================================================

function clearCheckoutForm() {

  const fields = [

    "customerName",

    "customerPhone",

    "customerAddress",

    "deliveryZone",

    "paymentMethod"

  ];

  fields.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );

      if (!element) {

        return;

      }

      if (
        element.tagName ===
        "SELECT"
      ) {

        element.selectedIndex =
          0;

      } else {

        element.value = "";

      }

    }
  );

  updateTotals();

}


// ============================================================
// INITIAL SEARCH SETUP
// ============================================================

setTimeout(
  () => {

    setupSearch();

  },
  0
);
// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatPrice(value) {

  const number =
    Number(value || 0);

  return `Rs. ${number.toLocaleString()}`;

}


// ============================================================
// FIND STORE
// ============================================================

function getStoreById(storeId) {

  return stores.find(
    store =>
      String(store.id) ===
      String(storeId)
  );

}


// ============================================================
// FIND CATEGORY
// ============================================================

function getCategoryById(
  categoryId
) {

  return categories.find(
    category =>
      String(category.id) ===
      String(categoryId)
  );

}


// ============================================================
// FIND PRODUCT
// ============================================================

function getProductById(
  productId
) {

  return products.find(
    product =>
      String(product.id) ===
      String(productId)
  );

}


// ============================================================
// PRODUCT STORE NAME
// ============================================================

function getProductStoreName(
  product
) {

  if (!product) {

    return "";

  }

  const store =
    getStoreById(
      product.store_id
    );

  return store
    ? store.name
    : "";

}


// ============================================================
// PRODUCT CATEGORY NAME
// ============================================================

function getProductCategoryName(
  product
) {

  if (!product) {

    return "";

  }

  const category =
    getCategoryById(
      product.category_id
    );

  return category
    ? category.name
    : "";

}


// ============================================================
// FILTER PRODUCTS BY STORE
// ============================================================

function filterProductsByStore(
  storeId
) {

  if (!storeId) {

    return [
      ...products
    ];

  }

  return products.filter(
    product =>
      String(
        product.store_id
      ) ===
      String(
        storeId
      )
  );

}


// ============================================================
// FILTER PRODUCTS BY CATEGORY
// ============================================================

function filterProductsByCategory(
  categoryId
) {

  if (!categoryId) {

    return [
      ...products
    ];

  }

  return products.filter(
    product =>
      String(
        product.category_id
      ) ===
      String(
        categoryId
      )
  );

}


// ============================================================
// CLEAR PRODUCT FILTERS
// ============================================================

function clearProductFilters() {

  selectedStore = null;

  selectedCategory = null;

  searchTerm = "";

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  if (searchInput) {

    searchInput.value = "";

  }

  updateCategoryButtons();

  renderProducts();

}


// ============================================================
// STORE FILTER
// ============================================================

function selectStore(
  storeId
) {

  selectedStore =
    storeId || null;

  renderProducts();

  scrollToProducts();

}


// ============================================================
// CATEGORY FILTER
// ============================================================

function selectCategory(
  categoryId
) {

  selectedCategory =
    categoryId || null;

  updateCategoryButtons();

  renderProducts();

}


// ============================================================
// CART VALIDATION
// ============================================================

function validateCart() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return false;

  }

  return true;

}


// ============================================================
// CART STORE
// ============================================================

function getCartStore() {

  if (!cart.length) {

    return null;

  }

  return getStoreById(
    cart[0].store_id
  );

}


// ============================================================
// CART ITEM COUNT
// ============================================================

function getCartItemCount() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        Number(
          item.quantity || 0
        )
      );

    },
    0
  );

}


// ============================================================
// CART TOTAL ITEMS
// ============================================================

function getCartTotalItems() {

  return cart.length;

}


// ============================================================
// CART TOTAL
// ============================================================

function getCartTotal() {

  return (
    getSubtotal() +
    getDeliveryFee()
  );

}


// ============================================================
// UPDATE CHECKOUT TOTAL
// ============================================================

function updateCheckoutTotal() {

  const element =
    document.getElementById(
      "checkoutTotal"
    );

  if (!element) {

    return;

  }

  element.textContent =
    formatPrice(
      getCartTotal()
    );

}


// ============================================================
// DELIVERY ZONE HELPER
// ============================================================

function getSelectedDeliveryZone() {

  const select =
    document.getElementById(
      "deliveryZone"
    );

  if (!select) {

    return null;

  }

  const zoneId =
    select.value;

  if (!zoneId) {

    return null;

  }

  return deliveryZones.find(
    zone =>
      String(
        zone.id
      ) ===
      String(
        zoneId
      )
  ) || null;

}


// ============================================================
// DELIVERY FEE FROM ZONE
// ============================================================

function getDeliveryFeeFromZone(
  zoneId
) {

  if (!zoneId) {

    return 0;

  }

  const zone =
    deliveryZones.find(
      item =>
        String(
          item.id
        ) ===
        String(
          zoneId
        )
    );

  if (!zone) {

    return 0;

  }

  return Number(
    zone.delivery_fee || 0
  );

}


// ============================================================
// CART LOCAL STORAGE
// ============================================================

function saveCart() {

  try {

    localStorage.setItem(
      "chakswariMarketplaceCart",
      JSON.stringify(
        cart
      )
    );

  } catch (error) {

    console.error(
      "Unable to save cart:",
      error
    );

  }

}


// ============================================================
// LOAD CART FROM STORAGE
// ============================================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "chakswariMarketplaceCart"
      );

    if (!saved) {

      return;

    }

    const parsed =
      JSON.parse(
        saved
      );

    if (
      Array.isArray(
        parsed
      )
    ) {

      cart = parsed;

    }

  } catch (error) {

    console.error(
      "Unable to load saved cart:",
      error
    );

    cart = [];

  }

}


// ============================================================
// CLEAR SAVED CART
// ============================================================

function clearSavedCart() {

  try {

    localStorage.removeItem(
      "chakswariMarketplaceCart"
    );

  } catch (error) {

    console.error(
      "Unable to clear saved cart:",
      error
    );

  }

}


// ============================================================
// ENHANCED CART SAVE
// ============================================================

// Save whenever the cart changes.

const originalAddToCart =
  addToCart;

const originalRemoveFromCart =
  removeFromCart;

const originalChangeQuantity =
  changeQuantity;


// ============================================================
// CLOSE OVERLAYS WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener(
  "click",
  event => {

    const cartOverlay =
      document.getElementById(
        "cartOverlay"
      );

    const checkoutOverlay =
      document.getElementById(
        "checkoutOverlay"
      );

    if (
      event.target ===
      cartOverlay
    ) {

      closeCartPanel();

    }

    if (
      event.target ===
      checkoutOverlay
    ) {

      closeCheckoutModal();

    }

  }
);


// ============================================================
// ESCAPE KEY
// ============================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }

    closeCartPanel();

    closeCheckoutModal();

  }
);


// ============================================================
// MOBILE MENU
// ============================================================

function setupMobileMenu() {

  const menuButton =
    document.getElementById(
      "menuButton"
    );

  const nav =
    document.getElementById(
      "mainNav"
    );

  if (
    !menuButton ||
    !nav
  ) {

    return;

  }

  menuButton.addEventListener(
    "click",
    () => {

      nav.classList.toggle(
        "active"
      );

    }
  );

}


// ============================================================
// NAVIGATION LINKS
// ============================================================

function setupNavigation() {

  const links =
    document.querySelectorAll(
      "a[href^='#']"
    );

  links.forEach(
    link => {

      link.addEventListener(
        "click",
        event => {

          const targetId =
            link
              .getAttribute(
                "href"
              );

          if (
            !targetId ||
            targetId === "#"
          ) {

            return;

          }

          const target =
            document.querySelector(
              targetId
            );

          if (!target) {

            return;

          }

          event.preventDefault();

          target.scrollIntoView({
            behavior:
              "smooth"
          });

        }
      );

    }
  );

}


// ============================================================
// BACK TO TOP
// ============================================================

function setupBackToTop() {

  const button =
    document.getElementById(
      "backToTop"
    );

  if (!button) {

    return;

  }

  window.addEventListener(
    "scroll",
    () => {

      if (
        window.scrollY >
        500
      ) {

        button.classList.add(
          "show"
        );

      } else {

        button.classList.remove(
          "show"
        );

      }

    }
  );

  button.addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior:
          "smooth"
      });

    }
  );

}


// ============================================================
// IMAGE FALLBACK
// ============================================================

function setupImageFallbacks() {

  document.addEventListener(
    "error",
    event => {

      const image =
        event.target;

      if (
        image.tagName !==
        "IMG"
      ) {

        return;

      }

      image.style.display =
        "none";

      const parent =
        image.parentElement;

      if (
        parent &&
        !parent.querySelector(
          ".image-fallback"
        )
      ) {

        const fallback =
          document.createElement(
            "div"
          );

        fallback.className =
          "image-fallback";

        fallback.textContent =
          "🍽️";

        parent.appendChild(
          fallback
        );

      }

    },
    true
  );

}


// ============================================================
// REFRESH MARKETPLACE
// ============================================================

async function refreshMarketplace() {

  console.log(
    "Refreshing marketplace..."
  );

  await loadMarketplace();

  updateCartUI();

}


// ============================================================
// REFRESH PRODUCTS
// ============================================================

async function refreshProducts() {

  await loadProducts();

  renderProducts();

}


// ============================================================
// REFRESH STORES
// ============================================================

async function refreshStores() {

  await loadStores();

  renderStores();

}


// ============================================================
// REFRESH CATEGORIES
// ============================================================

async function refreshCategories() {

  await loadCategories();

  renderCategories();

  renderProducts();

}


// ============================================================
// REFRESH DELIVERY ZONES
// ============================================================

async function refreshDeliveryZones() {

  await loadDeliveryZones();

  updateTotals();

}


// ============================================================
// INITIALIZE EXTRA FEATURES
// ============================================================

function initializeExtraFeatures() {

  setupMobileMenu();

  setupNavigation();

  setupBackToTop();

  setupImageFallbacks();

}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeExtraFeatures();

    loadCart();

    updateCartUI();

  }
);


// ============================================================
// WINDOW GLOBALS
// ============================================================

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.changeQuantity =
  changeQuantity;

window.openCart =
  openCart;

window.closeCartPanel =
  closeCartPanel;

window.openCheckout =
  openCheckout;

window.closeCheckoutModal =
  closeCheckoutModal;

window.placeOrder =
  placeOrder;

window.selectStore =
  selectStore;

window.selectCategory =
  selectCategory;

window.clearProductFilters =
  clearProductFilters;

window.refreshMarketplace =
  refreshMarketplace;


// ============================================================
// FINAL READY MESSAGE
// ============================================================

console.log(
  "CHAKSWARI MARKETPLACE JS READY"
);
