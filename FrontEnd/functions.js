function generateTabPanes() {
  const navTabs = document.querySelectorAll(".nav-tabs .nav-link");
  const tabContent = document.querySelector("#nav-tabContent");

  // empty current tab-pane
  tabContent.innerHTML = "";

  navTabs.forEach((tab) => {
    // Retrieve the tab's ID, categoryId, and active state
    const targetId = tab.getAttribute("data-bs-target").replace("#", "");
    const categoryId = tab.getAttribute("categoryId");
    const isActive = tab.classList.contains("active") ? "show active" : "";

    // Dynamically insert each tab-pane and set categoryId as an attribute
    tabContent.insertAdjacentHTML(
      "beforeend",
      `<div class="tab-pane fade ${isActive}" id="${targetId}" role="tabpanel" aria-labelledby="${tab.id}" categoryId="${categoryId}">
                <!-- Here will be content for each tab -->
                <div class="row trending-product-grid"></div>
            </div>`
    );
  });
}

// Dynamically Populate Trending Product Grid
function populateProductGrid(products) {
  // check and populate product data after 500ms timeout
  setTimeout(function () {
    const activeTabPane = document.querySelector(".tab-pane.show.active");
    if (!activeTabPane) {
      console.log("No active tab pane found");
      return; // Exit to prevent errors
    }

    const categoryId = activeTabPane.getAttribute("categoryId");

    // Search for 'trending-product-grid' element within current active tab-pane
    const productGrid = activeTabPane.querySelector(".trending-product-grid");

    if (!productGrid) {
      console.error("No product grid found in the active tab pane!");
      return;
    }

    // Clear out product grid
    productGrid.innerHTML = "";

    // Loop through products data, create HTML and insert
    products.forEach((product) => {
      // Create dynamic HTML for product
      const productHTML = `
                <div class="col">
                    <div class="product-item">
                        ${
                          product.discount
                            ? `<span class="badge bg-success position-absolute m-3">-${product.discount}%</span>`
                            : ""
                        }
                        <a href="#" class="btn-wishlist"><svg width="24" height="24"><use xlink:href="#heart"></use></svg></a>
                        <figure>
                          <a href="product-details.html?id=${
                            product.id
                          }" title="${product.name}">
                            <img src="${
                              product.image || "images/thumb-bananas.png"
                            }" alt="${product.name}" class="tab-image">
                          </a>
                        </figure>
                        <input class="form-control" type="number" id="productId" name="productId" value="${
                          product.id
                        }" style="display:none"/>
                        <h3>${product.name}</h3>
                        <span class="qty">${product.quantityInStock} Unit</span>
                        <span class="rating">
                          <svg width="24" height="24" class="text-primary"><use xlink:href="#star-solid"></use></svg> ${
                            product.rating != null
                              ? product.rating.toFixed(1)
                              : "5.0"
                          }
                        </span>
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="input-group product-qty">
                              <span class="input-group-btn">
                                  <button type="button" class="quantity-left-minus btn btn-danger btn-number" data-type="minus">
                                    <svg width="16" height="16"><use xlink:href="#minus"></use></svg>
                                  </button>
                              </span>
                              <input type="text" id="quantity" name="quantity" class="form-control input-number" value="1">
                              <span class="input-group-btn">
                                  <button type="button" class="quantity-right-plus btn btn-success btn-number" data-type="plus">
                                      <svg width="16" height="16"><use xlink:href="#plus"></use></svg>
                                  </button>
                              </span>
                          </div>
                          <a href="#" class="nav-link add-to-cart">Add to Cart <iconify-icon icon="uil:shopping-cart"></iconify-icon></a>
                        </div>
                    </div>
                </div>
                `;

      // Insert product HTML into product grid
      productGrid.insertAdjacentHTML("beforeend", productHTML);
    });

    // bind event listeners for dynamically generated product elements
    productGrid.querySelectorAll(".product-item").forEach((productElement) => {
      const quantityInput = productElement.querySelector("#quantity");

      // bind click event for plus icon
      productElement
        .querySelector(".quantity-right-plus")
        .addEventListener("click", (e) => {
          e.preventDefault();
          let currentQuantity = parseInt(quantityInput.value) || 0;
          quantityInput.value = currentQuantity + 1; // increment quantity
        });

      // bind click event for minus icon
      productElement
        .querySelector(".quantity-left-minus")
        .addEventListener("click", (e) => {
          e.preventDefault();
          let currentQuantity = parseInt(quantityInput.value) || 0;
          if (currentQuantity > 0) {
            quantityInput.value = currentQuantity - 1; // decrement quantity
          }
        });
      // bind click event for "Add to Cart" button
      const addToCartButton = productElement.querySelector(".add-to-cart");
      if (addToCartButton) {
        addToCartButton.addEventListener("click", (event) => {
          event.preventDefault();

          // Get productId and quantity
          const productId = productElement.querySelector("#productId").value;
          const quantity = quantityInput.value;

          fetch("https://localhost:7221/api/carts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              productId: productId,
              change: quantity,
            }),
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Failed to add to cart.");
              }
            })
            .then((data) => {
              console.log("Cart updated successfully:", data);
              alert("Product added to cart!");
              fetchCartData();
            })
            .catch((error) => {
              console.error("Error adding to cart:", error);
              alert("Failed to add product to cart. Please try again.");
            });
        });
      }
    });
  }, 200); // Wait for 500ms to complete DOM rendering
}

function fetchProductsNPopulate(categoryId) {
  const apiUrl = categoryId
    ? `https://localhost:7221/api/products?categoryId=${categoryId}`
    : "https://localhost:7221/api/products";

  // Fetch products data from API and populate
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((products) => {
      populateProductGrid(products);
    })
    .catch((error) => {
      console.error("Error fetching products:", error);
    });
}

// Update product quantity and send request after clicking the cart +/- buttons
function updateQuantity(productElement, { quantity = null, change = null }) {
  const quantityInput = productElement.querySelector('[name="quantity"]');
  let currentQuantity = parseInt(quantityInput.value);

  // Get productId
  const productId =
    productElement.querySelector("[data-product-id]").dataset.productId;

  // Calculate new quantity
  let newQuantity;
  if (quantity !== null) {
    // If it's quantity that's passed in, update to that value
    newQuantity = quantity;
  } else if (change !== null) {
    // If it's change that's passed in, add that value to current quantity
    newQuantity = currentQuantity + change;
  } else {
    console.error("Either quantity or change must be provided.");
    return;
  }

  // The new quantity can't be less than 0
  if (newQuantity < 0) {
    console.error("Quantity cannot be less than 0.");
    return;
  }

  // Update value in input field
  quantityInput.value = newQuantity;

  // Prepare the request payload
  const payload = {
    productId: productId,
  };

  if (quantity !== null) {
    payload.quantity = newQuantity; // Use quantity
  } else if (change !== null) {
    payload.change = change; // Use change
  }

  // Send POST request to backend
  fetch("https://localhost:7221/api/carts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    credentials: "include", // include user credentials
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to update cart");
      }
      return response.json();
    })
    .then((data) => {
      fetchCartData(); // call function to update cart data
    })
    .catch((error) => console.error("Error:", error));
}

// Bind listeners to the quantity buttons of each item in the shopping cart
function bindCartQuantityEvents(cartList) {
  const productElements = cartList.querySelectorAll(".product-qty");

  productElements.forEach((productElement) => {
    // Bind "+" button event
    productElement
      .querySelector(".quantity-right-plus")
      .addEventListener("click", (e) => {
        e.preventDefault();
        updateQuantity(productElement, { change: 1 }); // Increment quantity
      });

    // Bind "-" button event
    productElement
      .querySelector(".quantity-left-minus")
      .addEventListener("click", (e) => {
        e.preventDefault();
        updateQuantity(productElement, { change: -1 }); // Decrement quantity
      });

    // bind change quantity input event
    const quantityInput = productElement.querySelector('[name="quantity"]');
    quantityInput.addEventListener("change", (e) => {
      const newQuantity = parseInt(e.target.value);
      if (isNaN(newQuantity) || newQuantity < 0) {
        // if the input is less than 0 or invalid, revert to previous value
        e.target.value = parseInt(quantityInput.dataset.previousValue || 0);
        return;
      }
      // record the new value and update quantity in frontend and backend
      quantityInput.dataset.previousValue = newQuantity;
      updateQuantity(productElement, { quantity: newQuantity });
    });
  });
}

// Update content of the cart
function updateCart(data) {
  const cartList = document.querySelector("#offcanvasCart .list-group");
  const totalBadge = document.querySelector("#offcanvasCart .badge");
  const totalPriceElement = document.querySelector(".cart-total");

  // Update the total price under "your cart" on index page
  totalPriceElement.textContent = `$${(data?.totalPrice || 0).toFixed(2)}`;
  cartList.innerHTML = ""; // Clear out cart list

  let totalQuantity = 0;
  // if there are cart items, populate the cart
  if (data != null) {
    data.items.forEach((item) => {
      const cartItem = document.createElement("li");
      cartItem.className =
        "list-group-item d-flex justify-content-between lh-sm";
      cartItem.innerHTML = `
      <div>
        <h6 class="my-0">${item.productName}</h6>
        <div class="input-group product-qty">
          <span class="input-group-btn">
            <button type="button" class="quantity-left-minus btn btn-sm btn-number" data-type="minus">
              <svg width="16" height="16">
                <use xlink:href="#minus"></use>
              </svg>
            </button>
          </span>
          <input type="text" name="quantity" class="form-control input-number" value="${
            item.quantity
          }" style="width: 60px;text-align: center; ">
          <span class="input-group-btn">
            <button type="button" class="quantity-right-plus btn btn-sm btn-number" data-type="plus">
              <svg width="16" height="16">
                <use xlink:href="#plus"></use>
              </svg>
            </button>
          </span>
          <span class="text-body-secondary" data-product-id="${
            item.productId
          }" style="display:none"></span>
        </div>
      </div>
      <span class="text-body-secondary">$${(
        item.quantity * item.productPrice
      ).toFixed(2)}</span>
    `;
      totalQuantity += item.quantity;
      cartList.appendChild(cartItem);
    });
  }
  // attach the final li element for total price, price will be 0 if cart is empty
  const totalPriceItem = document.createElement("li");
  totalPriceItem.className = "list-group-item d-flex justify-content-between";
  totalPriceItem.innerHTML = `            
    <span>Total</span>
    <strong>$${(data?.totalPrice || 0).toFixed(2)}</strong>
  `;
  cartList.appendChild(totalPriceItem);

  // Update total quantity
  totalBadge.textContent = totalQuantity;

  bindCartQuantityEvents(cartList);
}

// Clear out cart and prompt for login
function clearCartAndPromptLogin() {
  const cartElement = document.querySelector("#offcanvasCart .offcanvas-body"); // 定位购物车内容区域
  if (cartElement) {
    cartElement.innerHTML = `
      <div class="text-center">
        <p class="text-muted">Log in to see your saved items.</p>
        <a href="login.html" class="btn btn-primary">Sign In</a> <!-- 替换为实际登录页面路径 -->
      </div>
    `;
  } else {
    console.error("Cart element not found!");
  }
}

// Fetch cart data and update
function fetchCartData() {
  fetch("https://localhost:7221/api/carts", {
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    credentials: "include", // Include user credentials
  }) // Ensure the backend handles the route correctly
    .then((response) => {
      if (response.status === 401) {
        // Check for unauthorized access (user not logged in)
        clearCartAndPromptLogin(); // Call the function to clear the cart and prompt for log in
        return null;
      }
      if (response.status === 404) {
        updateCart();
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch cart data");
      }
      return response.json();
    })
    .then((data) => {
      if (data) {
        updateCart(data); // Only update the cart if the cart data exists
      }
    })
    .catch((error) => console.error("Error:", error));
}

async function logoutUser() {
  try {
    const response = await fetch("https://localhost:7221/api/account/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      credentials: "include", // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error("Logout failed.");
    }

    const data = await response.json();
    alert(data.message || "Logout successful!");
    // Optionally redirect to the login page or homepage
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Error during logout:", error);
    alert("An error occurred while logging out.");
  }
}
