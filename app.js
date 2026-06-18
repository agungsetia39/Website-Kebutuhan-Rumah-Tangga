const state = {
  kategori: [
    { id: 1, nama: "Makanan Pokok" },
    { id: 2, nama: "Bumbu Dapur" },
    { id: 3, nama: "Kebersihan" },
    { id: 4, nama: "Perawatan Diri" },
    { id: 5, nama: "Perlengkapan Rumah" }
  ],
  barang: [
    { id: 1, kategoriId: 1, nama: "Beras", satuan: "kg", stok: 0, minimum: 0, harga: 0 },
    { id: 2, kategoriId: 1, nama: "Minyak Goreng", satuan: "liter", stok: 0, minimum: 0, harga: 0 },
    { id: 3, kategoriId: 1, nama: "Telur", satuan: "butir", stok: 0, minimum: 0, harga: 0 },
    { id: 4, kategoriId: 2, nama: "Gula Pasir", satuan: "kg", stok: 0, minimum: 0, harga: 0 },
    { id: 5, kategoriId: 2, nama: "Garam", satuan: "bungkus", stok: 0, minimum: 0, harga: 0 },
    { id: 6, kategoriId: 3, nama: "Detergen", satuan: "kg", stok: 0, minimum: 0, harga: 0 },
    { id: 7, kategoriId: 3, nama: "Sabun Cuci Piring", satuan: "botol", stok: 0, minimum: 0, harga: 0 },
    { id: 8, kategoriId: 4, nama: "Pasta Gigi", satuan: "tube", stok: 0, minimum: 0, harga: 0 },
    { id: 9, kategoriId: 4, nama: "Sampo", satuan: "botol", stok: 0, minimum: 0, harga: 0 },
    { id: 10, kategoriId: 5, nama: "Tisu", satuan: "pack", stok: 0, minimum: 0, harga: 0 }
  ],
  anggota: [
    { id: 1, nama: "Ayah", peran: "Kepala Keluarga" },
    { id: 2, nama: "Ibu", peran: "Pengelola Belanja" },
    { id: 3, nama: "Anak", peran: "Anggota Keluarga" }
  ],
  belanja: [
    { id: 1, anggotaId: 2, tanggal: "2026-06-17", toko: "Toko Sembako Makmur", total: 197000, metode: "Tunai", catatan: "Belanja mingguan" },
    { id: 2, anggotaId: 1, tanggal: "2026-06-17", toko: "Minimarket Sejahtera", total: 78000, metode: "QRIS", catatan: "Tambahan perlengkapan rumah" }
  ],
  riwayatStok: [],
  riwayatOutputStok: [],
  keuangan: {
    pemasukanBulanan: 0
  }
};

const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const els = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  logoutBtn: document.querySelector("#logoutBtn"),
  addBarangForm: document.querySelector("#addBarangForm"),
  addKategori: document.querySelector("#addKategori"),
  monthlyIncomeForm: document.querySelector("#monthlyIncomeForm"),
  monthlyIncome: document.querySelector("#monthlyIncome"),
  clearInputHistoryBtn: document.querySelector("#clearInputHistoryBtn"),
  clearOutputHistoryBtn: document.querySelector("#clearOutputHistoryBtn"),
  pageTitle: document.querySelector("#pageTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  searchBarang: document.querySelector("#searchBarang"),
  filterKategori: document.querySelector("#filterKategori"),
  barangTable: document.querySelector("#barangTable")
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadManualData() {
  const savedItems = readStorage(
    "krtManualItems",
    readStorage("krtManualStock", {})
  );
  const savedCustomItems = readStorage("krtCustomItems", []);
  const savedInputHistory = readStorage("krtStockHistory", []);
  const savedOutputHistory = readStorage("krtStockOutputHistory", []);
  const savedFinance = readStorage("krtFinance", {});

  if (Array.isArray(savedCustomItems)) {
    savedCustomItems.forEach((item) => {
      if (!state.barang.some((barang) => barang.id === item.id)) {
        state.barang.push({
          id: Number(item.id),
          kategoriId: Number(item.kategoriId),
          nama: String(item.nama),
          satuan: String(item.satuan),
          stok: Number(item.stok) || 0,
          minimum: Number(item.minimum) || 0,
          harga: Number(item.harga) || 0,
          custom: true
        });
      }
    });
  }

  state.barang.forEach((item) => {
    const savedItem = savedItems[item.id];
    if (typeof savedItem === "object" && savedItem !== null) {
      item.stok = Number(savedItem.stok) || 0;
      item.minimum = Number(savedItem.minimum) || 0;
      item.harga = Number(savedItem.harga) || 0;
    } else if (Object.prototype.hasOwnProperty.call(savedItems, item.id)) {
      item.stok = Number(savedItem) || 0;
    }
  });

  state.riwayatStok = Array.isArray(savedInputHistory) ? savedInputHistory : [];
  state.riwayatOutputStok = Array.isArray(savedOutputHistory) ? savedOutputHistory : [];
  state.keuangan.pemasukanBulanan = Number(savedFinance.pemasukanBulanan) || 0;
}

function saveManualData() {
  const itemMap = Object.fromEntries(state.barang.map((item) => [
    item.id,
    { stok: item.stok, minimum: item.minimum, harga: item.harga }
  ]));

  try {
    localStorage.setItem("krtManualItems", JSON.stringify(itemMap));
    localStorage.setItem("krtCustomItems", JSON.stringify(state.barang.filter((item) => item.custom)));
    localStorage.setItem("krtStockHistory", JSON.stringify(state.riwayatStok.slice(0, 20)));
    localStorage.setItem("krtStockOutputHistory", JSON.stringify(state.riwayatOutputStok.slice(0, 20)));
    localStorage.setItem("krtFinance", JSON.stringify(state.keuangan));
  } catch {
    // Aplikasi tetap dapat digunakan jika penyimpanan browser tidak tersedia.
  }
}

function categoryName(id) {
  return state.kategori.find((item) => item.id === id)?.nama ?? "-";
}

function isLowStock(item) {
  return item.stok <= item.minimum;
}

function currentMonthName() {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());
}

function isThisMonth(record) {
  if (!record.timestamp) {
    return true;
  }

  const date = new Date(record.timestamp);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function stockInputTotal(record) {
  return (Number(record.jumlah) || 0) * stockInputPrice(record);
}

function stockInputPrice(record) {
  const harga = Number(record.hargaSaatInput);
  if (!Number.isNaN(harga)) {
    return harga;
  }

  const item = state.barang.find((barang) => barang.id === record.barangId);
  return item?.harga || 0;
}

function totalBelanjaBarangBulanIni() {
  return state.riwayatStok
    .filter(isThisMonth)
    .reduce((total, record) => total + stockInputTotal(record), 0);
}

function sisaUangBelanja() {
  return state.keuangan.pemasukanBulanan - totalBelanjaBarangBulanIni();
}

function showApp() {
  els.loginView.classList.add("is-hidden");
  els.appView.classList.remove("is-hidden");
  renderAll();
}

function showLogin() {
  els.appView.classList.add("is-hidden");
  els.loginView.classList.remove("is-hidden");
}

function renderMetrics() {
  const totalBarang = state.barang.length;
  const totalStok = state.barang.reduce((sum, item) => sum + item.stok, 0);
  const totalBelanja = totalBelanjaBarangBulanIni();
  const stokMenipis = state.barang.filter(isLowStock).length;

  document.querySelector("#totalBarang").textContent = totalBarang;
  document.querySelector("#totalStok").textContent = totalStok.toLocaleString("id-ID");
  document.querySelector("#totalBelanja").textContent = formatter.format(totalBelanja);
  document.querySelector("#totalPemasukan").textContent = formatter.format(state.keuangan.pemasukanBulanan);
  document.querySelector("#sisaUangBelanja").textContent = formatter.format(sisaUangBelanja());
  document.querySelector("#stokMenipis").textContent = stokMenipis;
}

function renderLowStock() {
  const list = document.querySelector("#lowStockList");
  const lowItems = state.barang.filter((item) => item.stok <= item.minimum + 1);

  document.querySelector("#lowStockBadge").textContent = `${lowItems.length} item`;
  list.innerHTML = lowItems.map((item) => `
    <div class="stack-item">
      <div>
        <strong>${item.nama}</strong>
        <span class="item-meta">${categoryName(item.kategoriId)} - Minimum ${item.minimum} ${item.satuan}</span>
      </div>
      <span class="status ${isLowStock(item) ? "warn" : "safe"}">${item.stok} ${item.satuan}</span>
    </div>
  `).join("");
}

function renderPurchaseSummary() {
  const currentInputs = state.riwayatStok.filter(isThisMonth).slice(0, 5);

  if (currentInputs.length === 0) {
    document.querySelector("#purchaseSummary").innerHTML = `
      <div class="stack-item">
        <div>
          <strong>Belum ada input barang bulan ini</strong>
          <span class="item-meta">Input stok masuk di menu Barang agar total belanja terhitung.</span>
        </div>
      </div>
    `;
    return;
  }

  document.querySelector("#purchaseSummary").innerHTML = currentInputs.map((item) => `
    <div class="stack-item">
      <div>
        <strong>${item.nama}</strong>
        <span class="item-meta">${item.waktu} - ${item.jumlah} ${item.satuan}</span>
      </div>
      <span class="status safe">${formatter.format(stockInputTotal(item))}</span>
    </div>
  `).join("");
}

function renderCategoryFilter() {
  const selected = els.filterKategori.value || "all";
  els.filterKategori.innerHTML = `<option value="all">Semua kategori</option>` + state.kategori.map((item) => (
    `<option value="${item.id}">${item.nama}</option>`
  )).join("");
  els.filterKategori.value = selected;

  els.addKategori.innerHTML = state.kategori.map((item) => (
    `<option value="${item.id}">${item.nama}</option>`
  )).join("");
}

function renderBarang() {
  const search = els.searchBarang.value.trim().toLowerCase();
  const kategori = els.filterKategori.value;
  const rows = state.barang.filter((item) => {
    const category = categoryName(item.kategoriId);
    const matchSearch = `${item.nama} ${category}`.toLowerCase().includes(search);
    const matchCategory = kategori === "all" || String(item.kategoriId) === kategori;
    return matchSearch && matchCategory;
  });

  els.barangTable.innerHTML = rows.map((item) => `
    <tr>
      <td>
        <div class="item-name-cell">
          <strong>${item.nama}</strong>
          ${item.custom ? `
            <button
              type="button"
              class="delete-item-btn"
              data-delete-item="${item.id}"
              aria-label="Hapus ${item.nama}"
              title="Hapus barang"
            >−</button>
          ` : ""}
        </div>
      </td>
      <td>${categoryName(item.kategoriId)}</td>
      <td>${item.stok} ${item.satuan}</td>
      <td>${item.minimum} ${item.satuan}</td>
      <td>${formatter.format(item.harga)}</td>
      <td><span class="status ${isLowStock(item) ? "warn" : "safe"}">${isLowStock(item) ? "Menipis" : "Aman"}</span></td>
      <td>
        <form class="stock-input" data-stock-form="${item.id}">
          <label class="manual-field">
            Input Stok
            <input name="masuk" type="number" min="0" step="0.01" placeholder="Masuk" aria-label="Stok masuk ${item.nama}">
          </label>
          <label class="manual-field">
            Output Stok
            <input name="keluar" type="number" min="0" step="0.01" placeholder="Keluar" aria-label="Stok keluar ${item.nama}">
          </label>
          <label class="manual-field">
            Minimum
            <input name="minimum" type="number" min="0" step="0.01" value="${item.minimum}" aria-label="Minimum ${item.nama}">
          </label>
          <label class="manual-field">
            Harga
            <input name="harga" type="number" min="0" step="100" value="${item.harga}" aria-label="Estimasi harga ${item.nama}">
          </label>
          <div class="stock-actions">
            <button type="submit" class="save-stock-btn">Simpan</button>
            <button type="button" class="reset-stock-btn" data-reset-item="${item.id}">Reset</button>
          </div>
        </form>
      </td>
    </tr>
  `).join("");
}

function renderStockHistory() {
  const list = document.querySelector("#stockHistoryList");
  document.querySelector("#stockHistoryCount").textContent = `${state.riwayatStok.length} data`;

  if (state.riwayatStok.length === 0) {
    list.innerHTML = `
      <div class="stack-item">
        <div>
          <strong>Belum ada input stok</strong>
          <span class="item-meta">Isi jumlah masuk dari kolom Atur Manual pada tabel barang.</span>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = state.riwayatStok.slice(0, 5).map((item) => `
    <div class="stack-item">
      <div>
        <strong>${item.nama}</strong>
        <span class="item-meta">${item.waktu} - tambah ${item.jumlah} ${item.satuan}, total ${formatter.format(stockInputTotal(item))}</span>
      </div>
      <span class="status safe">Admin</span>
    </div>
  `).join("");
}

function renderStockOutputHistory() {
  const list = document.querySelector("#stockOutputHistoryList");
  document.querySelector("#stockOutputHistoryCount").textContent = `${state.riwayatOutputStok.length} data`;

  if (state.riwayatOutputStok.length === 0) {
    list.innerHTML = `
      <div class="stack-item">
        <div>
          <strong>Belum ada output stok</strong>
          <span class="item-meta">Isi jumlah keluar dari kolom Atur Manual pada tabel barang.</span>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = state.riwayatOutputStok.slice(0, 5).map((item) => `
    <div class="stack-item">
      <div>
        <strong>${item.nama}</strong>
        <span class="item-meta">${item.waktu} - keluar ${item.jumlah} ${item.satuan}, stok ${item.sebelumnya} menjadi ${item.sesudah}</span>
      </div>
      <span class="status warn">Admin</span>
    </div>
  `).join("");
}

function renderBelanja() {
  const totalBelanja = totalBelanjaBarangBulanIni();
  document.querySelector("#financeMonthLabel").textContent = currentMonthName();
  els.monthlyIncome.value = state.keuangan.pemasukanBulanan;
  document.querySelector("#belanjaPemasukan").textContent = formatter.format(state.keuangan.pemasukanBulanan);
  document.querySelector("#belanjaBarangBulanIni").textContent = formatter.format(totalBelanja);
  document.querySelector("#belanjaSisaUang").textContent = formatter.format(sisaUangBelanja());

  const currentInputs = state.riwayatStok.filter(isThisMonth);
  if (currentInputs.length === 0) {
    document.querySelector("#belanjaList").innerHTML = `
      <article class="record-card">
        <header>
          <div>
            <h2>Belum ada belanja barang bulan ini</h2>
            <span class="item-meta">Data akan muncul otomatis dari input stok masuk di menu Barang.</span>
          </div>
        </header>
      </article>
    `;
    return;
  }

  document.querySelector("#belanjaList").innerHTML = currentInputs.map((item, index) => `
    <article class="record-card">
      <header>
        <div>
          <h2>${item.nama}</h2>
          <span class="item-meta">${item.waktu}</span>
        </div>
        <span class="status safe">${formatter.format(stockInputTotal(item))}</span>
      </header>
      <dl>
        <div><dt>Jumlah</dt><dd>${item.jumlah} ${item.satuan}</dd></div>
        <div><dt>Harga</dt><dd>${formatter.format(stockInputPrice(item))}</dd></div>
        <div><dt>Total</dt><dd>${formatter.format(stockInputTotal(item))}</dd></div>
        <div><dt>ID</dt><dd>#${index + 1}</dd></div>
      </dl>
    </article>
  `).join("");
}

function switchSection(section) {
  document.querySelectorAll(".section-view").forEach((view) => view.classList.add("is-hidden"));
  document.querySelector(`#${section}Section`).classList.remove("is-hidden");
  els.pageTitle.textContent = section === "barang" ? "Data Barang" : section.charAt(0).toUpperCase() + section.slice(1);

  els.navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.section === section);
  });
}

function renderAll() {
  renderMetrics();
  renderLowStock();
  renderPurchaseSummary();
  renderCategoryFilter();
  renderBarang();
  renderBelanja();
  renderStockHistory();
  renderStockOutputHistory();
}

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value.trim();

  if (username === "admin" && password === "admin123") {
    localStorage.setItem("krtLoggedIn", "true");
    els.loginError.textContent = "";
    showApp();
    return;
  }

  els.loginError.textContent = "Username atau password salah.";
});

els.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("krtLoggedIn");
  showLogin();
});

els.navItems.forEach((item) => {
  item.addEventListener("click", () => switchSection(item.dataset.section));
});

els.searchBarang.addEventListener("input", renderBarang);
els.filterKategori.addEventListener("change", renderBarang);

els.monthlyIncomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextIncome = Number(els.monthlyIncome.value);
  if (Number.isNaN(nextIncome) || nextIncome < 0) {
    return;
  }

  state.keuangan.pemasukanBulanan = nextIncome;
  saveManualData();
  renderAll();
});

els.clearInputHistoryBtn.addEventListener("click", () => {
  state.riwayatStok = [];
  saveManualData();
  renderStockHistory();
});

els.clearOutputHistoryBtn.addEventListener("click", () => {
  state.riwayatOutputStok = [];
  saveManualData();
  renderStockOutputHistory();
});

els.addBarangForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const nama = form.elements.nama.value.trim();
  const kategoriId = Number(form.elements.kategoriId.value);
  const satuan = form.elements.satuan.value.trim();
  const stok = Number(form.elements.stok.value);
  const minimum = Number(form.elements.minimum.value);
  const harga = Number(form.elements.harga.value);

  if (!nama || !satuan || Number.isNaN(kategoriId) || Number.isNaN(stok) || Number.isNaN(minimum) || Number.isNaN(harga)) {
    return;
  }

  const nextId = Math.max(...state.barang.map((item) => item.id), 0) + 1;
  const newItem = {
    id: nextId,
    kategoriId,
    nama,
    satuan,
    stok: Math.max(0, stok),
    minimum: Math.max(0, minimum),
    harga: Math.max(0, harga),
    custom: true
  };

  state.barang.push(newItem);
  if (newItem.stok > 0) {
    state.riwayatStok.unshift({
      barangId: newItem.id,
      nama: newItem.nama,
      satuan: newItem.satuan,
      sebelumnya: 0,
      jumlah: newItem.stok,
      sesudah: newItem.stok,
      hargaSaatInput: newItem.harga,
      timestamp: new Date().toISOString(),
      waktu: new Date().toLocaleString("id-ID")
    });
  }

  saveManualData();
  form.reset();
  form.elements.stok.value = 0;
  form.elements.minimum.value = 0;
  form.elements.harga.value = 0;
  renderAll();
});

els.barangTable.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target.closest("[data-stock-form]");
  if (!form) {
    return;
  }

  const id = Number(form.dataset.stockForm);
  const item = state.barang.find((barang) => barang.id === id);
  const masuk = Number(form.elements.masuk.value) || 0;
  const keluar = Number(form.elements.keluar.value) || 0;
  const minimum = Number(form.elements.minimum.value);
  const harga = Number(form.elements.harga.value);

  if (!item || masuk < 0 || keluar < 0 || Number.isNaN(minimum) || minimum < 0 || Number.isNaN(harga) || harga < 0) {
    return;
  }

  item.minimum = minimum;
  item.harga = harga;

  if (masuk > 0) {
    const sebelumnya = item.stok;
    item.stok += masuk;
    state.riwayatStok.unshift({
      barangId: item.id,
      nama: item.nama,
      satuan: item.satuan,
      sebelumnya,
      jumlah: masuk,
      sesudah: item.stok,
      hargaSaatInput: item.harga,
      timestamp: new Date().toISOString(),
      waktu: new Date().toLocaleString("id-ID")
    });
  }

  if (keluar > 0) {
    const sebelumnya = item.stok;
    item.stok = Math.max(0, item.stok - keluar);
    state.riwayatOutputStok.unshift({
      barangId: item.id,
      nama: item.nama,
      satuan: item.satuan,
      sebelumnya,
      jumlah: keluar,
      sesudah: item.stok,
      timestamp: new Date().toISOString(),
      waktu: new Date().toLocaleString("id-ID")
    });
  }

  saveManualData();
  renderAll();
});

els.barangTable.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-item]");
  if (deleteButton) {
    const id = Number(deleteButton.dataset.deleteItem);
    const item = state.barang.find((barang) => barang.id === id);

    if (!item?.custom || !window.confirm(`Hapus barang "${item.nama}" beserta seluruh riwayatnya?`)) {
      return;
    }

    state.barang = state.barang.filter((barang) => barang.id !== id);
    state.riwayatStok = state.riwayatStok.filter((record) => record.barangId !== id);
    state.riwayatOutputStok = state.riwayatOutputStok.filter((record) => record.barangId !== id);
    saveManualData();
    renderAll();
    return;
  }

  const resetButton = event.target.closest("[data-reset-item]");
  if (!resetButton) {
    return;
  }

  const id = Number(resetButton.dataset.resetItem);
  const item = state.barang.find((barang) => barang.id === id);
  if (!item || !window.confirm(`Reset stok, minimum, harga, dan riwayat "${item.nama}"?`)) {
    return;
  }

  item.stok = 0;
  item.minimum = 0;
  item.harga = 0;
  state.riwayatStok = state.riwayatStok.filter((record) => record.barangId !== id);
  state.riwayatOutputStok = state.riwayatOutputStok.filter((record) => record.barangId !== id);
  saveManualData();
  renderAll();
});

loadManualData();

if (localStorage.getItem("krtLoggedIn") === "true") {
  showApp();
} else {
  showLogin();
}
