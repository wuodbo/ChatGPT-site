(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const toast = $("#toast");
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  };

  // Mobile navigation
  const menuToggle = $(".menu-toggle");
  const nav = $(".main-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    menuToggle.textContent = isOpen ? "×" : "☰";
  });
  $$(".nav-link").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }));

  // Search
  const searchBar = $("#search-bar");
  const searchInput = $("#search-input");
  $("#search-toggle").addEventListener("click", () => {
    searchBar.hidden = !searchBar.hidden;
    if (!searchBar.hidden) searchInput.focus();
  });
  const applySearch = () => {
    const query = searchInput.value.trim().toLocaleLowerCase("ru");
    let shown = 0;
    $$(".product-card").forEach(card => {
      const matches = !query || card.dataset.name.toLocaleLowerCase("ru").includes(query) ||
        card.dataset.category.toLocaleLowerCase("ru").includes(query);
      card.dataset.searchHidden = String(!matches);
      card.hidden = !matches || !matchesCategory(card);
      if (!card.hidden) shown++;
    });
    $("#empty-state").hidden = shown > 0;
    $("#catalog-status").textContent = query ? `Результаты поиска: ${shown}` : "Наши любимые десерты";
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  };
  $("#search-submit").addEventListener("click", applySearch);
  searchInput.addEventListener("keydown", event => { if (event.key === "Enter") applySearch(); });

  // Catalog filtering and sorting
  let activeFilter = "Все";
  const matchesCategory = card => activeFilter === "Все" || card.dataset.category === activeFilter;
  const matchesExtraFilters = card => {
    const priceFilters = $$("[data-price-filter]:checked").map(input => input.dataset.priceFilter.split("-").map(Number));
    const flavorFilters = $$("[data-flavor-filter]:checked").map(input => input.dataset.flavorFilter);
    const price = Number(card.dataset.price);
    const priceMatch = !priceFilters.length || priceFilters.some(([min, max]) => price >= min && price < max);
    const text = `${card.dataset.name} ${card.dataset.category} ${card.dataset.flavor || ""}`.toLocaleLowerCase("ru");
    const flavorMatch = !flavorFilters.length || flavorFilters.some(flavor => text.includes(flavor.toLocaleLowerCase("ru")));
    return priceMatch && flavorMatch;
  };
  const renderCatalog = () => {
    const query = searchInput.value.trim().toLocaleLowerCase("ru");
    const sort = $("#sort-select").value;
    const cards = $$(".product-card");
    cards.sort((a, b) => {
      if (sort === "price-up") return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort === "price-down") return Number(b.dataset.price) - Number(a.dataset.price);
      return Number(a.dataset.popular) - Number(b.dataset.popular);
    });
    const grid = $("#product-grid");
    cards.forEach(card => {
      grid.appendChild(card);
      const matchesText = !query || card.dataset.name.toLocaleLowerCase("ru").includes(query) ||
        card.dataset.category.toLocaleLowerCase("ru").includes(query);
      card.hidden = !matchesText || !matchesCategory(card) || !matchesExtraFilters(card);
    });
    const visible = cards.filter(card => !card.hidden).length;
    $("#empty-state").hidden = visible !== 0;
    $("#catalog-status").textContent = query ? `Найдено товаров: ${visible}` : `${visible} десерта в подборке`;
  };
  $$(".filter-pill").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    $$(".filter-pill").forEach(item => item.classList.toggle("selected", item === button));
    renderCatalog();
  }));
  $$(".category-card").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.category;
    $$(".filter-pill").forEach(item => item.classList.toggle("selected", item.dataset.filter === activeFilter));
    searchInput.value = "";
    renderCatalog();
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  }));
  $("#sort-select").addEventListener("change", renderCatalog);
  $$("[data-price-filter], [data-flavor-filter]").forEach(input => input.addEventListener("change", renderCatalog));
  $("#clear-filters").addEventListener("click", () => {
    $$("[data-price-filter], [data-flavor-filter]").forEach(input => input.checked = false);
    activeFilter = "Все";
    searchInput.value = "";
    $$(".filter-pill").forEach(button => button.classList.toggle("selected", button.dataset.filter === "Все"));
    renderCatalog();
  });

  // Favorites
  const favorites = new Set();
  const updateFavorites = () => {
    $("#favorite-count").textContent = favorites.size;
    $("#favorites-toggle").setAttribute("aria-label", `Избранное: ${favorites.size}`);
  };
  $$(".favorite-button").forEach((button, index) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      const name = card.dataset.name;
      if (favorites.has(name)) {
        favorites.delete(name);
        button.classList.remove("is-favorite");
        button.textContent = "♡";
        showToast("Удалено из избранного");
      } else {
        favorites.add(name);
        button.classList.add("is-favorite");
        button.textContent = "♥";
        showToast("Добавлено в избранное");
      }
      updateFavorites();
    });
  });
  $("#favorites-toggle").addEventListener("click", () => {
    if (!favorites.size) return showToast("В избранном пока пусто — нажмите ♡ на карточке десерта");
    const favoriteNames = [...favorites].join(", ");
    showToast(`В избранном: ${favoriteNames}`);
  });

  // Demo cart: adds selected products to an in-memory order list
  const cart = [];
  $$(".add-button").forEach(button => button.addEventListener("click", () => {
    cart.push(button.dataset.add);
    $("#cart-count").textContent = cart.length;
    showToast(`«${button.dataset.add}» добавлен в ваш заказ`);
    button.innerHTML = "Добавлено ✓";
    setTimeout(() => { button.innerHTML = 'Добавить в заказ <span>＋</span>'; }, 1400);
  }));
  $(".cart-link").addEventListener("click", event => {
    if (cart.length) {
      event.preventDefault();
      showToast(`В вашем заказе: ${cart.join(", ")}`);
    }
  });

  // Order dialog and demo form
  const dialog = $("#order-dialog");
  const openDialog = () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };
  $("#open-order").addEventListener("click", openDialog);
  $("#open-order-home").addEventListener("click", openDialog);
  $("#open-order-custom").addEventListener("click", openDialog);
  $$(".dialog-close").forEach(button => button.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  $("#order-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const contact = String(data.get("contact") || "").trim();
    if (!contact) return showToast("Пожалуйста, укажите контакт для связи");
    dialog.close();
    event.currentTarget.reset();
    showToast("Спасибо! Форма заполнена. Для реальной отправки подключите backend или сервис форм.");
  });
  $("#newsletter-form").addEventListener("submit", event => {
    event.preventDefault();
    const email = $("#newsletter-email").value.trim();
    if (email) {
      event.currentTarget.reset();
      showToast("Спасибо за подписку! Сейчас это демонстрационный интерфейс.");
    }
  });

  // Prevent selecting a date in the past.
  const dateInput = $('#order-form input[name="date"]');
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  renderCatalog();
})();