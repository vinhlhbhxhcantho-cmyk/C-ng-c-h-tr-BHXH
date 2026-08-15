import { PolicyConfig } from "@/lib/policy-types";
import { NhomCode } from "@/lib/reference";

export type ContributionBreakdown = {
  base: number; // căn cứ đóng BHXH/BHYT/ÔĐ-TS/TNLĐ-BNN sau khi áp trần
  baseUI: number; // căn cứ đóng BHTN sau khi áp trần riêng (0 nếu nhóm không có BHTN)
  sanToiThieu: number;
  tranBHXH_BHYT: number;
  tranBHTN: number;
  duoiSan: boolean; // mucDong < sàn tối thiểu của nhóm
  nld: {
    oDauThaiSan: number;
    huuTriTuTuat: number;
    bhyt: number;
    bhtn: number;
    tnldBnn: number;
    tong: number;
  };
  donVi: {
    oDauThaiSan: number;
    huuTriTuTuat: number;
    bhyt: number;
    bhtn: number;
    tnldBnn: number;
    tong: number;
  };
  tongCong: number; // (nld.tong + donVi.tong) x soThang
  soThang: number;
};

export function isNhomKhongLuong(nhom: NhomCode): boolean {
  return nhom === "Q6" || nhom === "KQ";
}

export function mucDong(tienLuong: number, phuCap: number): number {
  return (tienLuong || 0) + (phuCap || 0);
}

export function sanToiThieu(nhom: NhomCode, policy: PolicyConfig, vung: 1 | 2 | 3 | 4): number {
  if (isNhomKhongLuong(nhom)) return policy.mucThamChieu;
  return policy.luongToiThieuVung[String(vung) as "1" | "2" | "3" | "4"];
}

export function tranBHXH_BHYT(policy: PolicyConfig): number {
  return policy.boiSoTranBHXH_BHYT * policy.mucThamChieu;
}

export function tranBHTN(policy: PolicyConfig, vung: 1 | 2 | 3 | 4): number {
  return policy.boiSoTranBHTN * policy.luongToiThieuVung[String(vung) as "1" | "2" | "3" | "4"];
}

/** Tính chi tiết mức đóng cho 1 người trong 1 kỳ (soThang tháng). */
export function calcContribution(params: {
  nhom: NhomCode;
  tienLuong: number;
  phuCap: number;
  policy: PolicyConfig;
  vung: 1 | 2 | 3 | 4;
  soThang: number;
}): ContributionBreakdown {
  const { nhom, tienLuong, phuCap, policy, vung, soThang } = params;
  const md = mucDong(tienLuong, phuCap);
  const san = sanToiThieu(nhom, policy, vung);
  const tranChinh = tranBHXH_BHYT(policy);
  const tranUI = tranBHTN(policy, vung);

  const base = Math.min(md, tranChinh);
  const khongLuong = isNhomKhongLuong(nhom);
  const baseUI = khongLuong ? 0 : Math.min(md, tranUI);

  const tyLe = khongLuong ? policy.tyLe.Q6_KQ : policy.tyLe.TZ_CZ;

  const nldODauThaiSan = tyLe.oDauThaiSan.nld * base;
  const nldHuuTri = tyLe.huuTriTuTuat.nld * base;
  const nldBhyt = tyLe.bhyt.nld * base;
  const nldBhtn = khongLuong ? 0 : tyLe.bhtn.nld * baseUI;
  const nldTnldBnn = khongLuong ? 0 : tyLe.tnldBnn.nld * base;

  const dvODauThaiSan = tyLe.oDauThaiSan.donVi * base;
  const dvHuuTri = tyLe.huuTriTuTuat.donVi * base;
  const dvBhyt = tyLe.bhyt.donVi * base;
  const dvBhtn = khongLuong ? 0 : tyLe.bhtn.donVi * baseUI;
  const dvTnldBnn = khongLuong ? 0 : tyLe.tnldBnn.donVi * base;

  const nldTong = nldODauThaiSan + nldHuuTri + nldBhyt + nldBhtn + nldTnldBnn;
  const dvTong = dvODauThaiSan + dvHuuTri + dvBhyt + dvBhtn + dvTnldBnn;

  return {
    base,
    baseUI,
    sanToiThieu: san,
    tranBHXH_BHYT: tranChinh,
    tranBHTN: tranUI,
    duoiSan: md < san,
    nld: {
      oDauThaiSan: nldODauThaiSan,
      huuTriTuTuat: nldHuuTri,
      bhyt: nldBhyt,
      bhtn: nldBhtn,
      tnldBnn: nldTnldBnn,
      tong: nldTong,
    },
    donVi: {
      oDauThaiSan: dvODauThaiSan,
      huuTriTuTuat: dvHuuTri,
      bhyt: dvBhyt,
      bhtn: dvBhtn,
      tnldBnn: dvTnldBnn,
      tong: dvTong,
    },
    tongCong: (nldTong + dvTong) * soThang,
    soThang,
  };
}

export function formatVND(n: number): string {
  return Math.round(n).toLocaleString("vi-VN") + " đ";
}
