function queryId() {
  return document.getElementById(...arguments);
}
function query() {
  return document.querySelector(...arguments);
}
function queryAll() {
  return Array.from(document.querySelectorAll(...arguments));
}
function createElement() {
  return document.createElement(...arguments);
}
function removeClass(el, className) {
  el.className = el.className.replace(" " + className, "").replace(className, "");
  return el;
}
function addClass(el, className) {
  removeClass(el, className);
  el.className += " " + className;
  return el;
}
function copyText(text = "") {
  const copy = () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = text;
    input.select(); /* Select the text field */
    input.setSelectionRange(0, 99999); /* Select the text for mobile devices */
    document.execCommand("copy");
    input.remove();
    popMessage("Copied product link");
  };
  navigator.clipboard.writeText(text).then(() => popMessage("Copied product link"), copy);
}

class Cookies {
  static set(name, value, expires) {
    document.cookie = name + "=" + value + ";" + (expires || "");
  }
  static get(name) {
    return Cookies.getAll().find((cookie) => cookie[name])[name] || null;
  }
  static getAll() {
    return document.cookie.split(";").map((str) => {
      const cookie = str.split("=");
      return { [cookie[0].trim()]: cookie[1] };
    });
  }
  static remove(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

class Cart {
  static add(item) {
    item.id = crypto.randomUUID();
    const cart = Cart.getItems();
    const items = cart.filter(
      (p) => p.number !== item.number || p.type !== item.type || p.size !== item.size
    );
    items.push(item);
    window.localStorage.setItem("cart", JSON.stringify(Array.from(items)));
    updateNavbarShoppingCart(items.length);
  }
  static remove(itemId) {
    const cart = Cart.getItems().filter((item) => item.id !== itemId);
    window.localStorage.setItem("cart", JSON.stringify(cart));
    updateNavbarShoppingCart(cart.length);
  }
  static getItems() {
    try {
      return JSON.parse(window.localStorage.cart);
    } catch (error) {
      return [];
    }
  }
  static empty() {
    window.localStorage.setItem("cart", "[]");
  }
}

function logout(_, cb = () => window.location.reload()) {
  fetch("/api/auth/logout").then(cb).catch(cb);
}

function priceToString(price) {
  return currency + ((Number.parseInt(price) * rate) / 100).toFixed(2);
}

function formToObject(form, data = {}) {
  Array.from(new FormData(form).keys()).forEach((k) => (data[k] = form[k].value));
  return data;
}

function setLoading(state) {
  queryId("loading-screen-wrapper").style.display = state ? "flex" : "none";
}
function showErrorMessage(message) {
  const messageElement = queryId("prompt-message");
  if (!message) return removeClass(messageElement, "show");
  messageElement.children[0].innerText = message;
  addClass(messageElement, "show");
  clearTimeout(window.errorTime);
  window.errorTime = setTimeout(showErrorMessage, 1000 * 30);
}

function networkError() {
  setLoading(false);
  showErrorMessage("Failed to request, Please checkout your network connection!");
}

function renderProduct(productWrapper, product) {
  productWrapper.children[0].href = "/product/" + product.number;

  const pictures = productWrapper.querySelectorAll(".product.img");
  pictures[0].src = product.pictures[0];
  if (product.pictures[1]) pictures[1].src = product.pictures[1];

  productWrapper.querySelector(".product.name").innerText = product.name;
  productWrapper.querySelector(".product.price").innerText = priceToString(product.price);
  if (product.shippingCost === 0) query(".product.shipping-cost").innerText = "Free";
  else {
    productWrapper.querySelector(".product.shipping-cost").innerText = priceToString(product.shippingCost);
  }
  productWrapper.querySelector(".product.country").innerText = product.country;
  productWrapper.querySelector(".stars.front").style.width = Math.round((product.stars / 5) * 100) + "%";
  productWrapper.querySelector(".product.sold").innerText = product.sold;
  const addBtn = productWrapper.querySelector(".product.add");
  addBtn.dataset.number = product.number;
  addBtn.dataset.name = product.name;
  addBtn.dataset.type = product.type;
  addBtn.dataset.size = product.size;
  addBtn.dataset.price = product.price;
  addBtn.dataset.currency = product.currency;
  addBtn.dataset.country = product.country;
  addBtn.dataset.shippingCost = product.shippingCost;
  addBtn.dataset.picture = product.pictures[0];
  return productWrapper;
}
