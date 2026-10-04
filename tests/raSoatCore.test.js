const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Nạp phần lõi xử lý nhúng trong tools/ra-soat-tiem-nang.html (thẻ <script id="ra-soat-core">)
function loadCore() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'ra-soat-tiem-nang.html'), 'utf8');
  const m = html.match(/<script id="ra-soat-core">([\s\S]*?)<\/script>/);
  assert.ok(m, 'không tìm thấy script lõi');
  const ctx = vm.createContext({});
  vm.runInContext(m[1], ctx);
  return ctx.RaSoatCore;
}
const C = loadCore();
const plain = v => JSON.parse(JSON.stringify(v));

// Dựng tập dữ liệu từ bảng thô, đi qua đúng đường ống dò tiêu đề → ghép cột → trích bản ghi
function build(target, aoa, opts, merges) {
  const rows = aoa.map(r => r.slice());
  if (merges) C.applyMerges(rows, merges, 0, 0);
  const h = C.detectHeader(rows, target);
  const mapping = C.suggestMapping(h.rawHeaders, target);
  return C.extractRecords(rows, target, mapping, h.dataStart, opts || {}).records;
}

test('normalizeMST: bù số 0, tách chi nhánh, nhận diện số định danh', () => {
  assert.deepEqual(plain(C.normalizeMST('1801234567')), { key: '1801234567', parent: '1801234567', branch: '', kind: 'MST' });
  assert.equal(C.normalizeMST(301234567).key, '0301234567'); // Excel làm mất số 0
  assert.equal(C.normalizeMST('1801234567 - 001').key, '1801234567-001');
  assert.equal(C.normalizeMST('1801234567001').parent, '1801234567');
  assert.equal(C.normalizeMST(301234567001).key, '0301234567-001'); // MST 13 số mất số 0
  assert.equal(C.normalizeMST('1801234567-000').key, '1801234567');
  assert.equal(C.normalizeMST('084091005566').kind, 'CCCD');
  assert.equal(C.normalizeMST(84091005566).key, '084091005566');
  assert.equal(C.normalizeMST('').key, '');
  assert.equal(C.normalizeMST('12345').kind, 'KHAC');
});

test('normalizePersonId: CCCD/CMND mất số 0 đầu', () => {
  assert.deepEqual(plain(C.normalizePersonId(79089006543)), { key: '079089006543', kind: 'CCCD' });
  assert.deepEqual(plain(C.normalizePersonId('079 089 006 543')), { key: '079089006543', kind: 'CCCD' });
  assert.equal(C.normalizePersonId('361234567').kind, 'CMND');
  assert.equal(C.normalizePersonId('12345').key, '');
});

test('parseYear: chuỗi, năm, số serial Excel, Date', () => {
  assert.equal(C.parseYear('15/06/1998'), 1998);
  assert.equal(C.parseYear(1990), 1990);
  assert.equal(C.parseYear(34405), 1994);
  assert.equal(C.parseYear('34405'), 1994);
  assert.equal(C.parseYear(new Date(1985, 4, 20)), 1985);
  assert.equal(C.parseYear(''), null);
  assert.equal(C.parseYear('không rõ'), null);
});

test('TCVN3 → Unicode', () => {
  const s = 'NguyÔn V¨n Hïng - C«ng ty TNHH';
  assert.ok(C.looksLikeTCVN3([s]));
  assert.equal(C.tcvn3ToUnicode(s), 'Nguyễn Văn Hùng - Công ty TNHH');
  assert.ok(!C.looksLikeTCVN3(['Nguyễn Văn Hùng', 'Công ty Cổ phần Tây Đô']));
});

test('suggestMapping: phân biệt MST cá nhân / MST đơn vị, không lấy nhầm cột', () => {
  const headers = ['STT', 'Họ và tên', 'Mã số thuế cá nhân', 'Số CCCD', 'Ngày sinh', 'Tên tổ chức trả thu nhập', 'MST tổ chức trả thu nhập', 'Tổng thu nhập chịu thuế', 'Số tháng'];
  const m = plain(C.suggestMapping(headers, 'EXT_EMPS'));
  assert.deepEqual(m, { hoTen: 1, mstCaNhan: 2, cccd: 3, ngaySinh: 4, tenDonVi: 5, mstDonVi: 6, thuNhap: 7, soThang: 8 });

  const u = plain(C.suggestMapping(['STT', 'Mã đơn vị', 'Tên đơn vị', 'Mã số thuế', 'Họ tên giám đốc', 'Số LĐ đang đóng'], 'BHXH_UNITS'));
  assert.equal(u.maDonVi, 1);
  assert.equal(u.tenDonVi, 2);
  assert.equal(u.mst, 3);
  assert.equal(u.soLaoDong, 5);

  const hkd = plain(C.suggestMapping(['Mã số thuế', 'Tên doanh nghiệp / Hộ kinh doanh', 'Người đại diện / Chủ hộ', 'Số CCCD chủ hộ'], 'EXT_UNITS'));
  assert.deepEqual(hkd, { mst: 0, tenDonVi: 1, nguoiDaiDien: 2, cccd: 3 });
});

test('detectHeader: tiêu đề gộp 2 dòng + dòng đánh số (1)(2)…', () => {
  const aoa = [
    ['DANH SÁCH LAO ĐỘNG'],
    ['STT', 'Họ và tên', 'Mã số BHXH', 'Ngày sinh', 'Số CCCD', 'Đơn vị', ''],
    ['', '', '', '', '', 'Mã đơn vị', 'Tên đơn vị'],
    ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)'],
    [1, 'Nguyễn Văn A', '7912345678', '1990', '087094001234', 'TZ0123A', 'Công ty A']
  ];
  const merges = [0, 1, 2, 3, 4].map(c => ({ s: { r: 1, c }, e: { r: 2, c } })).concat([{ s: { r: 1, c: 5 }, e: { r: 1, c: 6 } }]);
  C.applyMerges(aoa, merges, 0, 0);
  const h = C.detectHeader(aoa, 'BHXH_EMPS');
  assert.equal(h.headerRow, 2);
  assert.equal(h.dataStart, 4);
  const m = C.suggestMapping(h.rawHeaders, 'BHXH_EMPS');
  assert.equal(m.maDonVi, 5);
  assert.equal(m.tenDonVi, 6);
  assert.equal(m.hoTen, 1);
});

test('extractRecords: không bỏ nhầm dòng "Công ty…", bỏ dòng Tổng cộng', () => {
  const recs = build('BHXH_UNITS', [
    ['Mã đơn vị', 'Tên đơn vị', 'Mã số thuế'],
    ['TZ01', 'Công ty TNHH A', '1801234567'],
    ['TZ02', 'Tống Văn B - Hộ KD', '1801234568'],
    ['', 'Tổng cộng', '']
  ]);
  assert.equal(recs.length, 2);
  assert.equal(recs[0].ten, 'Công ty TNHH A');
});

test('mergeRecords: gộp theo khóa, không nhân đôi, đếm đúng', () => {
  const a = build('EXT_UNITS', [['Mã số thuế', 'Tên doanh nghiệp'], ['1801234567', 'Công ty A'], ['1801234568', 'Công ty B']]);
  const b = build('EXT_UNITS', [['Mã số thuế', 'Tên doanh nghiệp', 'Điện thoại'], [1801234567, 'Công ty A', '0909'], ['1801234569', 'Công ty C', ''], ['1801234569', 'Công ty C', '']]);
  const r = C.mergeRecords(a, b, C.KEY_FN.EXT_UNITS, 'MERGE');
  assert.equal(r.list.length, 3);
  assert.equal(r.added, 1);
  assert.equal(r.updated, 1);
  assert.equal(r.dupInFile, 1);
  assert.equal(r.list.find(x => x.mst.key === '1801234567').dienThoai, '0909');
});

function scenario() {
  const bhxhUnits = build('BHXH_UNITS', [
    ['Mã đơn vị', 'Tên đơn vị', 'Mã số thuế', 'Số LĐ đang đóng', 'Trạng thái'],
    ['TZ01', 'Công ty Cổ Phần Cơ Khí Vạn Phát', '1801234567', 42, 'Đang hoạt động'],
    ['TO03', 'Công ty TNHH Thực Phẩm Sông Hậu', '1803456789', 28, 'Đang hoạt động'],
    ['YN04', 'Công ty Cổ Phần Logistics Tây Nam', '1804567890', 65, 'Đang hoạt động'],
    ['TZ05', 'Công ty TNHH Hoàng Kim', '1805678901', 0, 'Tạm dừng đóng'],
    ['DL01', 'Công ty Điện Lực', '1800112233', 850, 'Đang hoạt động']
  ]);
  const extUnits = build('EXT_UNITS', [
    ['Mã số thuế', 'Tên doanh nghiệp', 'Số CCCD chủ hộ'],
    ['1801234567', 'Công ty CP Cơ Khí Vạn Phát', ''],
    ['1803456789-001', 'Chi nhánh Sông Hậu tại Ô Môn', ''],
    ['1804567899', 'CÔNG TY CP LOGISTICS TÂY NAM', ''],
    ['1805678901', 'Công ty TNHH Hoàng Kim', ''],
    ['1809988771', 'Công ty TNHH Công Nghệ Số Tây Đô', ''],
    ['8392100415', 'Hộ KD Quán Ăn Bến Ninh Kiều', '090085001928']
  ]);
  const bhxhEmps = build('BHXH_EMPS', [
    ['Họ và tên', 'Mã số BHXH', 'Ngày sinh', 'Số CCCD', 'Mã đơn vị', 'Mức lương đóng', 'Trạng thái'],
    ['Nguyễn Văn Hùng', '7912345678', 34405, 87094001234, 'TZ01', 5000000, 'Đang tham gia'],
    ['Võ Thị Lan', '7911223344', '1992', '083092004455', 'TZ01', 7000000, 'Báo giảm'],
    ['Phạm Minh Khoa', '7922334455', '1993', '080093001122', 'DL01', 11000000, 'Đang tham gia'],
    ['Trần Văn Sang', '7988221144', '1985', '090085001928', 'DL01', 12000000, 'Đang tham gia'],
    ['Lê Thị Hồng', '7933445566', '1988', '', 'TZ01', 6000000, 'Đang tham gia'],
    ['Đặng Văn Tài', '7944556677', '1990', '', 'DL01', 7500000, 'Đang tham gia']
  ]);
  const extEmps = build('EXT_EMPS', [
    ['Họ và tên', 'Số CCCD', 'Ngày sinh', 'Tên tổ chức trả thu nhập', 'MST tổ chức trả thu nhập', 'Tổng thu nhập chịu thuế', 'Số tháng'],
    ['Nguyễn Văn Hùng', '087094001234', '1994', 'Vạn Phát', '1801234567', 120000000, 12],
    ['Võ Thị Lan', '083092004455', '1992', 'Vạn Phát', '1801234567', 60000000, 8],
    ['Phạm Minh Khoa', '080093001122', '1993', 'Vạn Phát', '1801234567', 36000000, 6],
    ['Huỳnh Thanh Phong', '086095007788', '1995', 'Vạn Phát', '1801234567', 96000000, 12],
    ['Lê Thị Hồng', '', '1988', 'Vạn Phát', '1801234567', 72000000, 12],
    ['Đặng Văn Tài', '', '1990', 'Tây Đô', '1809988771', 80000000, 10],
    ['Mai Thị Ngọc', '094099003344', '1999', 'Tây Đô', '1809988771', 70000000, 10]
  ], { source: 'THUE_QTT' });
  return { bhxhUnits, extUnits, bhxhEmps, extEmps };
}

test('reconcile đơn vị: khớp MST, chi nhánh & trùng tên → Nghi vấn, ngừng đóng, chủ hộ đã có sổ', () => {
  const res = C.reconcile(scenario(), {}, {});
  const by = k => res.units.find(u => u.mst.key === k);
  assert.equal(by('1801234567').reconcileStatus, 'DA_THAM_GIA');
  assert.equal(by('1803456789-001').reconcileStatus, 'NGHI_VAN');
  const fuzzy = by('1804567899');
  assert.equal(fuzzy.reconcileStatus, 'NGHI_VAN'); // trùng tên không được tự kết luận "Đã tham gia"
  assert.equal(fuzzy.similarityPct, 100);
  assert.equal(by('1805678901').reconcileStatus, 'NGUNG_DONG');
  assert.equal(by('1809988771').reconcileStatus, 'CHUA_THAM_GIA');
  assert.equal(by('1809988771').qttChuaTg, 1);
  assert.equal(by('8392100415').ownerInsured.unit, 'Công ty Điện Lực');
});

test('reconcile lao động: CCCD mất số 0, báo giảm, khác đơn vị, tên+năm sinh, đóng thấp', () => {
  const res = C.reconcile(scenario(), { incomeGapPct: 30 }, {});
  const by = n => res.emps.find(e => e.hoTen === n);
  const hung = by('Nguyễn Văn Hùng');
  assert.equal(hung.reconcileStatus, 'DA_THAM_GIA');
  assert.equal(hung.incomeFlag.gap, 50); // TN bình quân 10tr, đóng 5tr
  assert.equal(by('Võ Thị Lan').reconcileStatus, 'NGUNG_DONG');
  assert.equal(by('Phạm Minh Khoa').reconcileStatus, 'KHAC_DON_VI');
  assert.equal(by('Huỳnh Thanh Phong').reconcileStatus, 'CHUA_THAM_GIA');
  assert.equal(by('Lê Thị Hồng').reconcileStatus, 'DA_THAM_GIA'); // họ tên + năm sinh + cùng đơn vị
  assert.equal(by('Đặng Văn Tài').reconcileStatus, 'NGHI_VAN'); // trùng tên+năm sinh nhưng khác đơn vị

  const under = res.underReport.find(r => r.mst === '1801234567');
  assert.ok(under);
  assert.equal(under.soLdQtt, 5);
  assert.equal(under.soChuaTg, 1);
  assert.equal(under.soKhacDv, 2);
  assert.equal(under.soDongThap, 1);
});

test('reconcile giữ kết quả xác minh thủ công qua các lần chạy lại', () => {
  const ds = scenario();
  const first = C.reconcile(ds, {}, {});
  const tai = first.emps.find(e => e.hoTen === 'Đặng Văn Tài');
  const unit = first.units.find(u => u.mst.key === '1809988771');
  const work = {
    units: { [unit.id]: { actionStatus: 'DA_LAP_BIEN_BAN', explanationType: 'CHUA_CO_LAO_DONG', officer: 'Cán bộ A' } },
    emps: { [tai.id]: { verdict: 'CHUA_THAM_GIA', actionStatus: 'DA_GUI_THONG_BAO' } }
  };
  const again = C.reconcile(ds, { fuzzyThreshold: 90 }, work);
  const u2 = again.units.find(u => u.id === unit.id);
  assert.equal(u2.actionStatus, 'DA_LAP_BIEN_BAN');
  assert.equal(u2.officer, 'Cán bộ A');
  // Giải trình "chưa có lao động" mâu thuẫn với QTT + lưu ý người quản lý DN
  assert.ok(u2.hints.some(h => h.level === 'warn' && h.text.includes('Mâu thuẫn')));
  assert.ok(u2.hints.some(h => h.text.includes('người quản lý doanh nghiệp')));
  const t2 = again.emps.find(e => e.id === tai.id);
  assert.equal(t2.reconcileStatus, 'CHUA_THAM_GIA');
  assert.equal(t2.autoStatus, 'NGHI_VAN');

  const sum = C.summarize(again);
  assert.equal(sum.u.total, 6);
  assert.equal(sum.u.joined, 1);
  assert.equal(sum.u.suspect, 2);
  assert.equal(sum.u.stopped, 1);
});

test('Bảng 1 kèm biên bản: đủ họ tên, mã BHXH, ngày sinh theo giới tính, ghi chú', () => {
  const res = C.reconcile(scenario(), {}, {});
  const unit = { mst: C.normalizeMST('1801234567') };
  const list = plain(C.laborListForUnit(res, unit));
  assert.deepEqual(list.map(r => r.hoTen), ['Huỳnh Thanh Phong', 'Phạm Minh Khoa', 'Võ Thị Lan']);
  const lan = list.find(r => r.hoTen === 'Võ Thị Lan');
  assert.equal(lan.maSoBhxh, '7911223344'); // lấy từ CSDL BHXH khi đã có sổ
  assert.equal(lan.gioiTinh, 'NAM'); // CCCD 083092… → chữ số thứ 4 = 0 (Nam, sinh thế kỷ 20)
  assert.ok(list.find(r => r.hoTen === 'Huỳnh Thanh Phong').ghiChu.includes('CCCD 086095007788'));
  assert.ok(list.find(r => r.hoTen === 'Huỳnh Thanh Phong').ghiChu.includes('8.000.000'));
  assert.equal(C.genderOf({ gioiTinh: 'Nữ', cccd: { kind: 'CCCD', key: '086095007788' } }), 'NU');
  assert.equal(C.genderOf({ cccd: { kind: 'CCCD', key: '089300005511' } }), 'NU');
  assert.equal(C.genderOf({ cccd: { kind: 'CCCD', key: '086095007788' } }), 'NAM');
});
