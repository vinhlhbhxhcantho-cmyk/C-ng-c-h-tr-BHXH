-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maDonVi" TEXT,
    "tenDonVi" TEXT NOT NULL,
    "mst" TEXT NOT NULL,
    "diaChiTruSo" TEXT,
    "diaChiLienHe" TEXT,
    "email" TEXT,
    "dienThoai" TEXT,
    "nguoiDaiDien" TEXT,
    "soDinhDanhCaNhan" TEXT,
    "loaiHinhDonVi" TEXT,
    "nganhKinhTe" TEXT,
    "noiDangKyBHXH" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "gioiTinh" TEXT NOT NULL,
    "ngaySinh" DATETIME,
    "cccd" TEXT,
    "nhom" TEXT NOT NULL,
    "chucDanh" TEXT NOT NULL,
    "tienLuong" REAL NOT NULL,
    "phuCap" REAL NOT NULL DEFAULT 0,
    "tuThang" TEXT NOT NULL,
    "ngayHDLDHieuLuc" DATETIME,
    "noiDangKyKCB" TEXT,
    "loaiBienDong" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "maDonVi" TEXT NOT NULL,
    "tenDonVi" TEXT NOT NULL,
    "loaiKy" TEXT NOT NULL,
    "giaTriKy" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soLaoDong" INTEGER NOT NULL,
    "tongQuyLuong" REAL NOT NULL,
    "soLuotTangMoi" INTEGER NOT NULL,
    "soLuotGiam" INTEGER NOT NULL,
    "participantsJson" TEXT NOT NULL,
    CONSTRAINT "LedgerEntry_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'current',
    "json" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_maDonVi_key" ON "Unit"("maDonVi");

-- CreateIndex
CREATE INDEX "Unit_mst_idx" ON "Unit"("mst");

-- CreateIndex
CREATE INDEX "Participant_unitId_idx" ON "Participant"("unitId");

-- CreateIndex
CREATE INDEX "LedgerEntry_unitId_idx" ON "LedgerEntry"("unitId");

-- CreateIndex
CREATE INDEX "LedgerEntry_giaTriKy_idx" ON "LedgerEntry"("giaTriKy");
