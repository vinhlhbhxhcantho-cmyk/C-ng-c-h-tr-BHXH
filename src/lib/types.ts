export type Unit = {
  id: string;
  maDonVi: string | null;
  tenDonVi: string;
  mst: string;
  diaChiTruSo: string | null;
  diaChiLienHe: string | null;
  email: string | null;
  dienThoai: string | null;
  nguoiDaiDien: string | null;
  soDinhDanhCaNhan: string | null;
  loaiHinhDonVi: string | null;
  nganhKinhTe: string | null;
  noiDangKyBHXH: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { participants: number; ledgerEntries: number };
};

export type Participant = {
  id: string;
  unitId: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string | null;
  cccd: string | null;
  nhom: string;
  chucDanh: string;
  tienLuong: number;
  phuCap: number;
  tuThang: string;
  ngayHDLDHieuLuc: string | null;
  noiDangKyKCB: string | null;
  loaiBienDong: string;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntrySummary = {
  id: string;
  unitId: string;
  maDonVi: string;
  tenDonVi: string;
  loaiKy: string;
  giaTriKy: string;
  savedAt: string;
  soLaoDong: number;
  tongQuyLuong: number;
  soLuotTangMoi: number;
  soLuotGiam: number;
};

export type LuyKe = { soKy: number; tangMoi: number; giam: number; tongQuyLuong: number };
