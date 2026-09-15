(function () {
  const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
  }

  const TOKEN_KEY = 'bhxh_admin_token';
  const PROFILE_KEY = 'bhxh_admin_profile';

  const loginCard = document.getElementById('login-card');
  const adminArea = document.getElementById('admin-area');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const captchaImage = document.getElementById('captcha-image');
  const captchaInput = document.getElementById('captcha-input');
  const captchaRefreshBtn = document.getElementById('captcha-refresh');

  let captchaToken = null;

  async function loadCaptcha() {
    captchaInput.value = '';
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      captchaImage.innerHTML = data.svg;
      captchaToken = data.token;
    } catch (err) {
      captchaImage.textContent = 'Không tải được mã xác nhận';
      captchaToken = null;
    }
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function authHeaders() {
    return { Authorization: `Bearer ${getToken()}` };
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), ...authHeaders() },
    });
    if (res.status === 401) {
      doLogout();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    return res;
  }

  function doLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    loginCard.hidden = false;
    adminArea.hidden = true;
  }

  function showAdminArea(profile) {
    document.getElementById('welcome-name').textContent = profile.fullName;
    document.getElementById('welcome-username').textContent = ` (${profile.username})`;
    loginCard.hidden = true;
    adminArea.hidden = false;
    loadKyList();
    loadImportLogs();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const captchaAnswer = captchaInput.value.trim();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken, captchaAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || 'Đăng nhập thất bại.';
        loginError.hidden = false;
        await loadCaptcha();
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(data));
      showAdminArea(data);
    } catch (err) {
      loginError.textContent = 'Không kết nối được máy chủ.';
      loginError.hidden = false;
    }
  });

  captchaRefreshBtn.addEventListener('click', loadCaptcha);
  loadCaptcha();

  document.getElementById('logout-btn').addEventListener('click', doLogout);

  // -- Nạp dữ liệu --
  const importForm = document.getElementById('import-form');
  const importError = document.getElementById('import-error');
  const importSuccess = document.getElementById('import-success');
  const importBtn = document.getElementById('import-btn');

  importForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    importError.hidden = true;
    importSuccess.hidden = true;
    importBtn.disabled = true;
    importBtn.textContent = 'Đang nạp...';

    const ky = document.getElementById('ky-input').value.trim();
    const file = document.getElementById('file-input').files[0];
    const formData = new FormData();
    formData.append('ky', ky);
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/admin/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        importError.textContent = data.error || 'Nạp dữ liệu thất bại.';
        importError.hidden = false;
        return;
      }
      importSuccess.textContent =
        `Đã nạp kỳ ${data.ky}: ${data.upserted}/${data.totalDataRows} đơn vị ` +
        `(bỏ qua ${data.skippedNoMaDvi} dòng không có mã đơn vị). Sheet: ${data.sheetName}`;
      importSuccess.hidden = false;
      importForm.reset();
      loadKyList();
      loadImportLogs();
    } catch (err) {
      importError.textContent = err.message || 'Có lỗi xảy ra.';
      importError.hidden = false;
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = 'Nạp dữ liệu';
    }
  });

  // -- Danh sách kỳ --
  async function loadKyList() {
    try {
      const res = await apiFetch('/api/admin/ky');
      const rows = await res.json();
      const tbody = document.querySelector('#ky-table tbody');
      tbody.innerHTML = '';
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.ky}</td><td>${row.so_don_vi}</td>`;
        tbody.appendChild(tr);
      }
    } catch (err) {
      // đã xử lý logout ở apiFetch nếu hết phiên
    }
  }
  document.getElementById('refresh-ky-btn').addEventListener('click', loadKyList);

  // -- Đối chiếu đơn vị --
  document.getElementById('check-btn').addEventListener('click', async () => {
    const ky = document.getElementById('check-ky').value.trim();
    const search = document.getElementById('check-search').value.trim();
    if (!ky) return;
    const params = new URLSearchParams({ ky });
    if (search) params.set('search', search);
    try {
      const res = await apiFetch(`/api/admin/don-vi?${params.toString()}`);
      const rows = await res.json();
      const tbody = document.querySelector('#donvi-table tbody');
      tbody.innerHTML = '';
      for (const dv of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(dv.ma_don_vi)}</td><td>${escapeHtml(dv.ma_khoi)}</td><td>${escapeHtml(dv.ten_don_vi)}</td>
          <td>${dv.so_lao_dong ?? ''}</td>
          <td>${Number(dv.so_dau_ky).toLocaleString('vi-VN')}</td>
          <td>${Number(dv.so_ky_nay).toLocaleString('vi-VN')}</td>
          <td>${Number(dv.so_da_nop).toLocaleString('vi-VN')}</td>
          <td>${Number(dv.so_cuoi_ky).toLocaleString('vi-VN')}</td>
          <td>${escapeHtml(dv.thang_hoan_thanh)}</td>
          <td>${dv.ty_le_no !== null && dv.ty_le_no !== undefined ? dv.ty_le_no + ' tháng' : ''}</td>
          <td>${escapeHtml(dv.chuyen_quan)}</td>
        `;
        tbody.appendChild(tr);
      }
    } catch (err) {
      // no-op
    }
  });

  // -- Nhật ký nạp dữ liệu --
  async function loadImportLogs() {
    try {
      const res = await apiFetch('/api/admin/import-logs');
      const rows = await res.json();
      const tbody = document.querySelector('#logs-table tbody');
      tbody.innerHTML = '';
      for (const log of rows) {
        const tr = document.createElement('tr');
        const thoiGian = new Date(log.created_at).toLocaleString('vi-VN');
        tr.innerHTML = `
          <td>${thoiGian}</td>
          <td>${escapeHtml(log.full_name || log.username || '—')}</td>
          <td>${escapeHtml(log.ky)}</td>
          <td>${escapeHtml(log.file_name)}</td>
          <td>${log.rows_in_file}</td>
          <td>${log.rows_upserted}</td>
          <td>${log.rows_skipped}</td>
        `;
        tbody.appendChild(tr);
      }
    } catch (err) {
      // no-op
    }
  }
  document.getElementById('refresh-logs-btn').addEventListener('click', loadImportLogs);

  // Khôi phục phiên nếu đã đăng nhập trước đó trong cùng tab
  const savedToken = getToken();
  const savedProfile = sessionStorage.getItem(PROFILE_KEY);
  if (savedToken && savedProfile) {
    showAdminArea(JSON.parse(savedProfile));
  }
})();
