(function () {
  const BANKS = [
    { name: 'Agribank, CN Cần Thơ II', account: '1890202916015' },
    { name: 'BIDV, CN Cần Thơ', account: '7419842015' },
    { name: 'VietinBank, CN Tây Cần Thơ', account: '916015000002' },
    { name: 'Kho bạc Nhà nước', account: '3743.0.1056714.92008' },
  ];
  const ACCOUNT_NAME = 'BAO HIEM XA HOI THANH PHO CAN THO';

  const form = document.getElementById('lookup-form');
  const kySelect = document.getElementById('ky');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-msg');
  const resultCard = document.getElementById('result-card');
  const bankSelect = document.getElementById('bank-select');
  const captchaImage = document.getElementById('captcha-image');
  const captchaInput = document.getElementById('captcha-input');
  const captchaRefreshBtn = document.getElementById('captcha-refresh');

  let currentResult = null;
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

  function formatMoney(n) {
    return Math.round(n).toLocaleString('vi-VN') + ' đ';
  }

  function formatThangHoanThanh(yyyymm) {
    if (!yyyymm || yyyymm.length !== 6) return '—';
    const nam = yyyymm.slice(0, 4);
    const thang = yyyymm.slice(4, 6);
    return `Tháng ${thang}/${nam}`;
  }

  function formatSoThangNo(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return `${n} tháng`;
  }

  async function loadKyOptions() {
    try {
      const res = await fetch('/api/ky');
      const list = await res.json();
      kySelect.innerHTML = '';
      if (list.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'Chưa có dữ liệu';
        opt.disabled = true;
        kySelect.appendChild(opt);
        submitBtn.disabled = true;
        return;
      }
      for (const ky of list) {
        const opt = document.createElement('option');
        opt.value = ky;
        opt.textContent = formatThangHoanThanh(ky);
        kySelect.appendChild(opt);
      }
      kySelect.value = list[0]; // mặc định kỳ mới nhất
    } catch (err) {
      kySelect.innerHTML = '<option>Không tải được danh sách kỳ</option>';
    }
  }

  function populateBankSelect() {
    bankSelect.innerHTML = '';
    BANKS.forEach((bank, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${bank.name} — ${bank.account}`;
      bankSelect.appendChild(opt);
    });
  }

  function renderPayment(donVi) {
    const paidUpNote = document.getElementById('paid-up-note');
    const paymentSection = document.getElementById('payment-section');

    if (donVi.soCuoiKy <= 0) {
      paidUpNote.hidden = false;
      paymentSection.hidden = true;
      return;
    }
    paidUpNote.hidden = true;
    paymentSection.hidden = false;

    document.getElementById('pay-so-tien-hienthi').textContent = formatMoney(donVi.soCuoiKy);
    document.getElementById('pay-so-tien-raw').textContent = String(Math.round(donVi.soCuoiKy));
    document.getElementById('pay-ten-tk').textContent = ACCOUNT_NAME;

    updateBankDetails(donVi);
  }

  function updateBankDetails(donVi) {
    const bank = BANKS[Number(bankSelect.value)];
    const noiDung = `+BHXH+103+00+${donVi.maDonVi}+09200+dong BHXH`;

    document.getElementById('pay-so-tk').textContent = `${bank.account} (${bank.name})`;
    document.getElementById('pay-noi-dung').textContent = noiDung;
  }

  function renderResult(donVi) {
    currentResult = donVi;
    document.getElementById('result-ten-don-vi').textContent = donVi.tenDonVi || donVi.maDonVi;
    document.getElementById('result-meta').textContent = `Kỳ: ${formatThangHoanThanh(donVi.ky)}`;

    document.getElementById('r-ma-don-vi').textContent = donVi.maDonVi;
    document.getElementById('r-ma-khoi').textContent = donVi.maKhoi || '—';
    document.getElementById('r-so-lao-dong').textContent = donVi.soLaoDong ?? '—';
    document.getElementById('r-so-dau-ky').textContent = formatMoney(donVi.soDauKy);
    document.getElementById('r-so-ky-nay').textContent = formatMoney(donVi.soKyNay);
    document.getElementById('r-so-da-nop').textContent = formatMoney(donVi.soDaNop);
    document.getElementById('r-so-cuoi-ky').textContent = formatMoney(donVi.soCuoiKy);
    document.getElementById('r-thang-hoan-thanh').textContent = formatThangHoanThanh(donVi.thangHoanThanh);
    document.getElementById('r-ty-le-no').textContent = formatSoThangNo(donVi.tyLeNo);

    renderPayment(donVi);
    resultCard.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.hidden = true;
    resultCard.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang tra cứu...';

    const maDonVi = document.getElementById('maDonVi').value.trim();
    const email = document.getElementById('email').value.trim();
    const ky = kySelect.value;
    const captchaAnswer = captchaInput.value.trim();

    try {
      const res = await fetch('/api/tra-cuu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maDonVi, email, ky, captchaToken, captchaAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorMsg.textContent = data.error || 'Có lỗi xảy ra, vui lòng thử lại.';
        errorMsg.hidden = false;
        await loadCaptcha();
        return;
      }
      renderResult(data);
      await loadCaptcha();
    } catch (err) {
      errorMsg.textContent = 'Không kết nối được máy chủ. Vui lòng thử lại sau.';
      errorMsg.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tra cứu';
    }
  });

  captchaRefreshBtn.addEventListener('click', loadCaptcha);

  bankSelect.addEventListener('change', () => {
    if (currentResult) updateBankDetails(currentResult);
  });

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      const text = document.getElementById(targetId).textContent;
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Đã chép!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        // Trình duyệt không hỗ trợ clipboard API (ví dụ trang không phải HTTPS) — bỏ qua yên lặng.
      }
    });
  });

  populateBankSelect();
  loadKyOptions();
  loadCaptcha();
})();
