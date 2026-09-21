// ============================================================
// CHAKSWARI MARKETPLACE
// MAIN JAVASCRIPT
// Cart + Products + Stores + Categories + Delivery + Checkout
// ============================================================

console.log("CHAKSWARI MARKETPLACE JS STARTED");


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL = "https://afvgjmobxkkcgtmuedqj.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_tUX83g_zIzdRFMARlTnr7A_XTIQrlZe";

if (!window.supabase) {
  console.error("Supabase library was not loaded.");
  throw new Error("Supabase library missing.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ============================================================
// GLOBAL DATA
// ============================================================

let stores = [];
let categories = [];
let products = [];
let deliveryZones = [];

let cart = [];


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("DOM READY");

  loadCart();

  setupButtons();

  updateCart();

  await loadMarketplace();

});


// ============================================================
// MARKETPLACE LOADING
// ============================================================

async function loadMarketplace() {

  setProductLoading();

  const results = await Promise.allSettled([
    loadStores(),
    loadCategories(),
    loadProducts(),
    loadDeliveryZones()
  ]);

  results.forEach((result, index) => {

    if (result.status === "rejected") {

      const sections = [
        "stores",
        "categories",
        "products",
        "delivery zones"
      ];

      console.error(
        `Failed loading ${sections[index]}:`,
        result.reason
      );

    }

  });

  renderProducts(products);

}


// ============================================================
// LOAD STORES
// ============================================================

async function loadStores() {

  const { data, error } = await supabaseClient
    .from("stores")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Stores error:", error);
    throw error;
  }

  stores = data || [];

  renderStores();

}


// ============================================================
// RENDER STORES
// ============================================================

function renderStores() {

  const container =
    document.getElementById("storesContainer");

  if (!container) return;

  if (!stores.length) {

    container.innerHTML = `
      <div class="loading-card">
        No stores available yet.
      </div>
    `;

    return;
  }

  container.innerHTML = stores.map(store => {

    const id = escapeHTML(String(store.id));

    const name =
      escapeHTML(store.name || "Store");

    const address =
      escapeHTML(store.address || "Chakswari");

    return `
      <div
        class="store-card"
        onclick="filterStore('${id}')"
      >

        <h3>${name}</h3>

        <p>${address}</p>

      </div>
    `;

  }).join("");

}


// ============================================================
// LOAD CATEGORIES
// ============================================================

async function loadCategories() {

  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Categories error:", error);
    throw error;
  }

  categories = data || [];

  renderCategories();

}


// ============================================================
// RENDER CATEGORIES
// ============================================================

function renderCategories() {

  const container =
    document.getElementById("categoriesContainer");

  if (!container) return;

  if (!categories.length) {

    container.innerHTML = `
      <div class="loading-card">
        No categories available yet.
      </div>
    `;

    return;
  }

  container.innerHTML = categories.map(category => {

    const id = escapeHTML(String(category.id));

    const name =
      escapeHTML(category.name || "Category");

    return `
      <div
        class="category-card"
        onclick="filterCategory('${id}')"
      >
        ${name}
      </div>
    `;

  }).join("");

}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      *,
      stores(name),
      categories(name)
    `)
    .eq("active", true)
    .order("name");

  if (error) {

    console.error("Products error:", error);

    throw error;
  }

  products = data || [];

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(list) {

  const container =
    document.getElementById("productsContainer");

  const count =
    document.getElementById("productCount");

  if (!container) return;

  if (count) {

    count.textContent =
      `${list.length} product${list.length === 1 ? "" : "s"}`;

  }

  if (!list.length) {

    container.innerHTML = `
      <div class="loading-card">
        No products found.
      </div>
    `;

    return;
  }

  container.innerHTML = list.map(product => {

    const id =
      escapeHTML(String(product.id));

    const name =
      escapeHTML(product.name || "Product");

    const storeName =
      escapeHTML(
        product.stores?.name ||
        getStoreById(product.store_id)?.name ||
        "Local Store"
      );

    const price =
      Number(product.price || 0);

    const image =
      product.image_url ||
      "https://via.placeholder.com/500x400?text=Product";

    return `
      <div class="product-card">

        <img
          class="product-image"
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(name)}"
          onerror="this.src='https://via.placeholder.com/500x400?text=Product'"
        >

        <div class="product-info">

          <h3>${name}</h3>

          <p>${storeName}</p>

          <div class="price">
            Rs. ${formatPrice(price)}
          </div>

          <button
            class="add-button"
            type="button"
            onclick="addToCart('${id}')"
          >
            Add to Cart
          </button>

        </div>

      </div>
    `;

  }).join("");

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  input.addEventListener("input", () => {

    const query =
      input.value.trim().toLowerCase();

    if (!query) {

      renderProducts(products);

      return;
    }

    const filtered =
      products.filter(product => {

        const productName =
          String(product.name || "")
            .toLowerCase();

        const storeName =
          String(
            product.stores?.name ||
            getStoreById(product.store_id)?.name ||
            ""
          ).toLowerCase();

        return (
          productName.includes(query) ||
          storeName.includes(query)
        );

      });

    renderProducts(filtered);

  });

}


// ============================================================
// STORE FILTER
// ============================================================

function filterStore(storeId) {

  const filtered =
    products.filter(product =>
      String(product.store_id) === String(storeId)
    );

  renderProducts(filtered);

  scrollToProducts();

}


// ============================================================
// CATEGORY FILTER
// ============================================================

function filterCategory(categoryId) {

  const filtered =
    products.filter(product =>
      String(product.category_id) === String(categoryId)
    );

  renderProducts(filtered);

  scrollToProducts();

}


// ============================================================
// SHOW ALL PRODUCTS
// ============================================================

function showAllProducts() {

  renderProducts(products);

  scrollToProducts();

}


// ============================================================
// CART
// ============================================================

function addToCart(productId) {

  const product =
    getProductById(productId);

  if (!product) {

    showToast("Product not found.");

    return;
  }


  // ----------------------------------------------------------
  // Prevent products from different stores being mixed
  // ----------------------------------------------------------

  if (cart.length) {

    const currentStoreId =
      cart[0].store_id;

    if (
      String(currentStoreId) !==
      String(product.store_id)
    ) {

      showToast(
        "Please complete your current store order first."
      );

      return;
    }

  }


  const existing =
    cart.find(item =>
      String(item.id) === String(productId)
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      product_id: product.id,

      name: product.name,

      price: Number(product.price || 0),

      store_id: product.store_id,

      quantity: 1

    });

  }


  saveCart();

  updateCart();

  showToast(
    `${product.name} added to cart`
  );

}


// ============================================================
// REMOVE FROM CART
// ============================================================

function removeFromCart(productId) {

  cart =
    cart.filter(item =>
      String(item.id) !== String(productId)
    );

  saveCart();

  updateCart();

}


// ============================================================
// CHANGE QUANTITY
// ============================================================

function changeQuantity(productId, change) {

  const item =
    cart.find(item =>
      String(item.id) === String(productId)
    );

  if (!item) return;


  item.quantity += Number(change);


  if (item.quantity <= 0) {

    removeFromCart(productId);

    return;

  }


  saveCart();

  updateCart();

}


// ============================================================
// UPDATE CART
// ============================================================

function updateCart() {

  updateCartCount();

  renderCart();

  updateTotals();

}


// ============================================================
// CART COUNT
// ============================================================

function updateCartCount() {

  const countElement =
    document.getElementById("cartCount");

  if (!countElement) return;

  countElement.textContent =
    getCartItemCount();

}


// ============================================================
// CART ITEM COUNT
// ============================================================

function getCartItemCount() {

  return cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

}


// ============================================================
// RENDER CART
// ============================================================

function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!container) return;


  if (!cart.length) {

    container.innerHTML = `
      <p class="empty-message">
        Your cart is empty.
      </p>
    `;

    return;
  }


  container.innerHTML =
    cart.map(item => {

      const name =
        escapeHTML(item.name || "Product");

      const price =
        Number(item.price || 0);

      const quantity =
        Number(item.quantity || 0);

      const id =
        escapeHTML(String(item.id));


      return `
        <div class="cart-item">

          <div>

            <h4>
              ${name}
            </h4>

            <p>
              Rs. ${formatPrice(price)}
            </p>

          </div>


          <div class="cart-item-controls">

            <button
              type="button"
              onclick="changeQuantity('${id}', -1)"
            >
              −
            </button>

            <span>
              ${quantity}
            </span>

            <button
              type="button"
              onclick="changeQuantity('${id}', 1)"
            >
              +
            </button>

          </div>

        </div>
      `;

    }).join("");

}


// ============================================================
// GET SUBTOTAL
// ============================================================

function getSubtotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Number(item.quantity || 0),
    0
  );

}


// ============================================================
// GET CART TOTAL
// ============================================================

function getCartTotal() {

  return getSubtotal();

}


// ============================================================
// DELIVERY ZONES
// ============================================================

async function loadDeliveryZones() {

  const { data, error } =
    await supabaseClient
      .from("delivery_zones")
      .select("*")
      .eq("active", true)
      .order("delivery_fee");

  if (error) {

    console.error(
      "Delivery zones error:",
      error
    );

    throw error;
  }

  deliveryZones = data || [];

  populateDeliveryZones();

}


// ============================================================
// POPULATE DELIVERY ZONES
// ============================================================

function populateDeliveryZones() {

  const select =
    document.getElementById("deliveryZone");

  if (!select) return;


  select.innerHTML = `
    <option value="">
      Select delivery area
    </option>
  `;


  deliveryZones.forEach(zone => {

    const option =
      document.createElement("option");

    option.value = zone.id;

    option.dataset.fee =
      Number(zone.delivery_fee || 0);

    option.textContent =
      `${zone.name} — Rs. ${formatPrice(
        Number(zone.delivery_fee || 0)
      )}`;

    select.appendChild(option);

  });

}


// ============================================================
// SELECTED DELIVERY ZONE
// ============================================================

function getSelectedDeliveryZone() {

  const select =
    document.getElementById("deliveryZone");

  if (!select || !select.value) {

    return null;

  }


  return (
    deliveryZones.find(zone =>
      String(zone.id) ===
      String(select.value)
    ) || null
  );

}


// ============================================================
// DELIVERY FEE FROM ZONE
// ============================================================

function getDeliveryFeeFromZone(zone) {

  if (!zone) return 0;

  return Number(
    zone.delivery_fee || 0
  );

}


// ============================================================
// GET DELIVERY FEE
// ============================================================

function getDeliveryFee() {

  const zone =
    getSelectedDeliveryZone();

  return getDeliveryFeeFromZone(zone);

}


// ============================================================
// UPDATE TOTALS
// ============================================================

function updateTotals() {

  const subtotal =
    getSubtotal();

  const delivery =
    getDeliveryFee();

  const total =
    subtotal + delivery;


  const subtotalElement =
    document.getElementById("subtotal");

  const deliveryElement =
    document.getElementById("deliveryFee");

  const grandTotalElement =
    document.getElementById("grandTotal");

  const checkoutTotalElement =
    document.getElementById("checkoutTotal");


  if (subtotalElement) {

    subtotalElement.textContent =
      formatPrice(subtotal);

  }


  if (deliveryElement) {

    deliveryElement.textContent =
      formatPrice(delivery);

  }


  if (grandTotalElement) {

    grandTotalElement.textContent =
      formatPrice(total);

  }


  if (checkoutTotalElement) {

    checkoutTotalElement.textContent =
      formatPrice(total);

  }

}


// ============================================================
// CHECKOUT TOTAL
// ============================================================

function updateCheckoutTotal() {

  updateTotals();

}


// ============================================================
// CART VALIDATION
// ============================================================

function validateCart() {

  if (!cart.length) {

    showToast("Your cart is empty.");

    return false;

  }


  return true;

}


// ============================================================
// GET CART STORE
// ============================================================

function getCartStore() {

  if (!cart.length) return null;

  return getStoreById(
    cart[0].store_id
  );

}


// ============================================================
// BUTTON SETUP
// ============================================================

function setupButtons() {

  setupSearch();


  const cartButton =
    document.getElementById("cartButton");

  const closeCart =
    document.getElementById("closeCart");

  const cartOverlay =
    document.getElementById("cartOverlay");

  const checkoutButton =
    document.getElementById("checkoutButton");

  const closeCheckout =
    document.getElementById("closeCheckout");

  const checkoutOverlay =
    document.getElementById("checkoutOverlay");

  const placeOrderButton =
    document.getElementById("placeOrderButton");

  const deliveryZone =
    document.getElementById("deliveryZone");


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
// OPEN CART
// ============================================================

function openCart() {

  const panel =
    document.getElementById("cartPanel");

  const overlay =
    document.getElementById("cartOverlay");

  if (panel) {

    panel.classList.add("open");

  }

  if (overlay) {

    overlay.classList.add("open");

  }

  updateCart();

}


// ============================================================
// CLOSE CART
// ============================================================

function closeCartPanel() {

  const panel =
    document.getElementById("cartPanel");

  const overlay =
    document.getElementById("cartOverlay");


  if (panel) {

    panel.classList.remove("open");

  }

  if (overlay) {

    overlay.classList.remove("open");

  }

}


// ============================================================
// OPEN CHECKOUT
// ============================================================

function openCheckout() {

  if (!validateCart()) return;


  const modal =
    document.getElementById("checkoutModal");

  const overlay =
    document.getElementById("checkoutOverlay");


  if (modal) {

    modal.classList.add("open");

  }

  if (overlay) {

    overlay.classList.add("open");

  }


  updateCheckoutTotal();

}


// ============================================================
// CLOSE CHECKOUT
// ============================================================

function closeCheckoutModal() {

  const modal =
    document.getElementById("checkoutModal");

  const overlay =
    document.getElementById("checkoutOverlay");


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

  if (!validateCart()) return;


  const name =
    document
      .getElementById("customerName")
      ?.value
      .trim();


  const phone =
    document
      .getElementById("customerPhone")
      ?.value
      .trim();


  const address =
    document
      .getElementById("customerAddress")
      ?.value
      .trim();


  const zone =
    getSelectedDeliveryZone();


  const paymentMethod =
    document
      .getElementById("paymentMethod")
      ?.value ||
    "COD";


  if (!name) {

    showToast("Please enter your name.");

    return;

  }


  if (!phone) {

    showToast("Please enter your phone number.");

    return;

  }


  if (!address) {

    showToast("Please enter your address.");

    return;

  }


  if (!zone) {

    showToast("Please select your delivery area.");

    return;

  }


  const subtotal =
    getSubtotal();


  const deliveryFee =
    getDeliveryFeeFromZone(zone);


  const total =
    subtotal + deliveryFee;


  const button =
    document.getElementById(
      "placeOrderButton"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "Placing Order...";

  }


  try {

    // --------------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------------

    const { data: customer, error: customerError } =
      await supabaseClient
        .from("customers")
        .insert({
          name: name,
          phone: phone,
          address: address
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

    const { data: order, error: orderError } =
      await supabaseClient
        .from("orders")
        .insert({

          customer_id:
            customer.id,

          store_id:
            storeId,

          delivery_zone_id:
            zone.id,

          customer_name:
            name,

          customer_phone:
            phone,

          customer_address:
            address,

          subtotal:
            subtotal,

          delivery_fee:
            deliveryFee,

          total:
            total,

          payment_method:
            paymentMethod,

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
      cart.map(item => ({

        order_id:
          order.id,

        product_id:
          item.product_id || item.id,

        quantity:
          Number(item.quantity || 1),

        price:
          Number(item.price || 0)

      }));


    const {
      error: itemsError
    } =
      await supabaseClient
        .from("order_items")
        .insert(orderItems);


    if (itemsError) {

      throw itemsError;

    }


    // --------------------------------------------------------
    // WHATSAPP
    // --------------------------------------------------------

    const whatsappNumber =
      "923448343097";


    let message =
      `*NEW CHAKSWARI MARKETPLACE ORDER*%0A%0A`;


    message +=
      `*Order ID:* ${order.id}%0A`;

    message +=
      `*Customer:* ${name}%0A`;

    message +=
      `*Phone:* ${phone}%0A`;

    message +=
      `*Address:* ${address}%0A`;

    message +=
      `*Delivery Area:* ${zone.name}%0A`;

    message +=
      `*Payment:* ${paymentMethod}%0A%0A`;


    message +=
      `*ORDER ITEMS*%0A`;


    cart.forEach(item => {

      message +=
        `${item.name} x ${item.quantity} = Rs. ${
          formatPrice(
            Number(item.price) *
            Number(item.quantity)
          )
        }%0A`;

    });


    message +=
      `%0A*Subtotal:* Rs. ${formatPrice(subtotal)}%0A`;

    message +=
      `*Delivery:* Rs. ${formatPrice(deliveryFee)}%0A`;

    message +=
      `*TOTAL:* Rs. ${formatPrice(total)}%0A`;


    const whatsappURL =
      `https://wa.me/${whatsappNumber}?text=${message}`;


    // --------------------------------------------------------
    // SAVE / CLEAR
    // --------------------------------------------------------

    clearCart();


    closeCheckoutModal();

    closeCartPanel();


    showToast(
      "Order placed successfully!"
    );


    // Open WhatsApp
    setTimeout(() => {

      window.open(
        whatsappURL,
        "_blank"
      );

    }, 500);


  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );


    showToast(
      "Could not place the order. Check the Console for details."
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Place Order";

    }

  }

}


// ============================================================
// LOCAL STORAGE
// ============================================================

const CART_STORAGE_KEY =
  "chakswari_marketplace_cart";


function saveCart() {

  try {

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "Could not save cart:",
      error
    );

  }

}


function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        CART_STORAGE_KEY
      );


    if (!saved) {

      cart = [];

      return;

    }


    const parsed =
      JSON.parse(saved);


    if (Array.isArray(parsed)) {

      cart = parsed;

    } else {

      cart = [];

    }

  } catch (error) {

    console.error(
      "Could not load cart:",
      error
    );

    cart = [];

  }

}


function clearCart() {

  cart = [];

  try {

    localStorage.removeItem(
      CART_STORAGE_KEY
    );

  } catch (error) {

    console.error(
      "Could not clear cart:",
      error
    );

  }

  updateCart();

}


// ============================================================
// HELPERS
// ============================================================

function getStoreById(id) {

  return stores.find(store =>
    String(store.id) === String(id)
  ) || null;

}


function getCategoryById(id) {

  return categories.find(category =>
    String(category.id) === String(id)
  ) || null;

}


function getProductById(id) {

  return products.find(product =>
    String(product.id) === String(id)
  ) || null;

}


function formatPrice(value) {

  const number =
    Number(value || 0);

  return number.toLocaleString(
    "en-PK"
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


// ============================================================
// SCROLL
// ============================================================

function scrollToProducts() {

  const section =
    document.getElementById(
      "productsContainer"
    );

  if (!section) return;


  const top =
    section.getBoundingClientRect().top +
    window.scrollY -
    100;


  window.scrollTo({

    top: top,

    behavior: "smooth"

  });

}


// ============================================================
// LOADING
// ============================================================

function setProductLoading() {

  const container =
    document.getElementById(
      "productsContainer"
    );

  const count =
    document.getElementById(
      "productCount"
    );


  if (container) {

    container.innerHTML = `
      <div class="loading-card">
        Loading products...
      </div>
    `;

  }


  if (count) {

    count.textContent =
      "Loading...";

  }

}


// ============================================================
// TOAST
// ============================================================

let toastTimer = null;


function showToast(message) {

  const toast =
    document.getElementById("toast");

  if (!toast) {

    alert(message);

    return;

  }


  toast.textContent =
    message;


  toast.classList.add("show");


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 3000);

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.changeQuantity =
  changeQuantity;

window.filterStore =
  filterStore;

window.filterCategory =
  filterCategory;

window.showAllProducts =
  showAllProducts;

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

window.getCartTotal =
  getCartTotal;

window.getSubtotal =
  getSubtotal;

window.getDeliveryFee =
  getDeliveryFee;


// ============================================================
// END
// ============================================================

console.log(
  "CHAKSWARI MARKETPLACE JS LOADED SUCCESSFULLY"
);
