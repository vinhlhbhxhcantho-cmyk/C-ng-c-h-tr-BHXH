import { z } from "zod";

export const PolicyConfigSchema = z.object({
  hieuLucTu: z.string(),
  canCu: z.string(),
  mucThamChieu: z.number().positive(),
  luongToiThieuVung: z.object({
    "1": z.number().positive(),
    "2": z.number().positive(),
    "3": z.number().positive(),
    "4": z.number().positive(),
  }),
  luongToiThieuVungGio: z.object({
    "1": z.number().positive(),
    "2": z.number().positive(),
    "3": z.number().positive(),
    "4": z.number().positive(),
  }),
  vungMacDinh: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  boiSoTranBHXH_BHYT: z.number().positive(),
  boiSoTranBHTN: z.number().positive(),
  tyLe: z.object({
    TZ_CZ: z.object({
      oDauThaiSan: z.object({ nld: z.number(), donVi: z.number() }),
      huuTriTuTuat: z.object({ nld: z.number(), donVi: z.number() }),
      bhyt: z.object({ nld: z.number(), donVi: z.number() }),
      bhtn: z.object({ nld: z.number(), donVi: z.number() }),
      tnldBnn: z.object({ nld: z.number(), donVi: z.number() }),
    }),
    Q6_KQ: z.object({
      oDauThaiSan: z.object({ nld: z.number(), donVi: z.number() }),
      huuTriTuTuat: z.object({ nld: z.number(), donVi: z.number() }),
      bhyt: z.object({ nld: z.number(), donVi: z.number() }),
      bhtn: z.object({ nld: z.number(), donVi: z.number() }),
      tnldBnn: z.object({ nld: z.number(), donVi: z.number() }),
    }),
  }),
});

export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;
