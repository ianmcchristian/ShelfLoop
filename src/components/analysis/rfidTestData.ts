// ─── RFID Baked Test Data ─────────────────────────────────────────────────────
// Derived from "Box vs Tag Database" CSV, then enriched with real scan-ground-
// truth EPCs from multiple run files. Full EPCs are resolved by matching the
// placement label/suffix against observed EPC suffixes.
//
// Remaining discrepancies flagged in comments:
//   • Box 7 Front TL + Box 7 Top TR both claim '1BCAEBA' / same full EPC —
//     awaiting Akbar photo of Top TR face to resolve.
//   • Box 3 Front BR + Box 8 Top TL both claim '5C12988' / same full EPC —
//     documented as a known duplicate in the source sheet (both rows carry the
//     note "3/FRONT/BR and 8/TOP/TL duplicates"). Physical resolution pending.
//   • Box 6 Bottom TR 'B2456' — no full EPC scan match yet (moved from Box 5 after swap).
//   • Box 6 Back — 0 confirmed tags (B2446 was mis-entered here, belongs to Box 5).
//   • Box 6 Top — ⚠ ODS photo shows F806/AB3F6/F886/F846 but TR/BL/BR duplicate
//     Box 5 Top. Likely another Box5/Box6 face swap — keeping old DB values.
//   • Box 6 Bottom TR 'B2456' — no full EPC scan match yet.
//   • A few observed EPCs still do not belong to any placement slot.
//
// Synthetic scenarios below are still used only for test/demo mode.

import type { ResolvedTagPlacement, RunMeta, RunTagRead } from './rfidTypes';

// ─── Placement database ───────────────────────────────────────────────────────
// Format: [boxNumber, face, position, label, fullEpc | null]
//
// ─── KNOWN CONFLICTS / OPEN QUESTIONS (as of Session 25) ─────────────────────
//   • Box 7 Front TL + Box 7 Top TR both claim '1BCAEBA' / same full EPC —
//     physically impossible; awaiting Akbar photo confirmation of Top TR.
//   • Box 3 Front BR + Box 8 Top TL both claim '5C12988' / same full EPC —
//     documented as a known duplicate in source sheet; physical resolution pending.
//   • Box 5 Bottom TR '2B456' has no full EPC match yet.
//   • Box 6 Back now has 0 tagged slots — B2446 was mis-entered there;
//     physical tag belongs to Box 5 Back TL (Ian photo-confirmed).
//   • Box 5 Back TR/BL/BR removed — Ian confirmed only 1 physical tag on that
//     face (TL = B2446). Former EPCs AB376/AB386/AB3C6 are now homeless if
//     they appear in scans (surface as unexpected reads).
// prettier-ignore
const RAW_PLACEMENTS: [number, string, string, string, string | null][] = [
  // Box 1 — fully resolved after ground-truth scan enrichment
  [1,'Front','TL','283A0A5','E28011B0A502006C0283A0A5'],[1,'Front','TR','28452D4','E28011B0A502006C028452D4'],[1,'Front','BL','283A055','E28011B0A502006C0283A055'],[1,'Front','BR','283A674','E28011B0A502006C0283A674'],
  [1,'Back','TL','28452C4','E28011B0A502006C028452C4'],[1,'Back','TR','2845224','E28011B0A502006C02845224'],[1,'Back','BL','2844C84','E28011B0A502006C02844C84'],[1,'Back','BR','2844C34','E28011B0A502006C02844C34'],
  [1,'Left','TL','2847884','E28011B0A502006C02847884'],[1,'Left','TR','2835895','E28011B0A502006C02835895'],[1,'Left','BL','284C654','E28011B0A502006C0284C654'],[1,'Left','BR','284C0B4','E28011B0A502006C0284C0B4'],
  [1,'Right','TL','2844C24','E28011B0A502006C02844C24'],[1,'Right','TR','2845234','E28011B0A502006C02845234'],[1,'Right','BL','28452E5','E28011B0A502006C028452E5'],[1,'Right','BR','27C8006','E28011B0A502006C027C8006'],
  [1,'Top','TL','283A045','E28011B0A502006C0283A045'],[1,'Top','TR','283A074','E28011B0A502006C0283A074'],[1,'Top','BL','284C6A5','E28011B0A502006C0284C6A5'],[1,'Top','BR','284C0F5','E28011B0A502006C0284C0F5'],
  [1,'Bottom','TL','27C8066','E28011B0A502006C027C8066'],[1,'Bottom','TR','283A6C5','E28011B0A502006C0283A6C5'],[1,'Bottom','BL','2847875','E28011B0A502006C02847875'],[1,'Bottom','BR','284C085','E28011B0A502006C0284C085'],
  // Box 2 — master-list verified (unchanged)
  [2,'Front','TL','5C289B8','E28011B0A5020066E5C289B8'],[2,'Front','TR','5C10388','E28011B0A5020066E5C10388'],[2,'Front','BL','5C16FB8','E28011B0A5020066E5C16FB8'],[2,'Front','BR','5C16FE8','E28011B0A5020066E5C16FE8'],
  [2,'Back','TL','00B24C6','E2801191A5040076300B24C6'],[2,'Back','TR','5C25B38','E28011B0A5020066E5C25B38'],[2,'Back','BL','00B2496','E2801191A5040076300B2496'],[2,'Back','BR','5C1F5F8','E28011B0A5020066E5C1F5F8'],
  [2,'Left','TL','00A4E36','E2801191A5040076300A4E36'],[2,'Left','TR','00A4E46','E2801191A5040076300A4E46'],[2,'Left','BL','5C1F538','E28011B0A5020066E5C1F538'],[2,'Left','BR','00A4E06','E2801191A5040076300A4E06'],
  [2,'Right','TL','5C1F5B8','E28011B0A5020066E5C1F5B8'],[2,'Right','TR','5C1F588','E28011B0A5020066E5C1F588'],[2,'Right','BL','5C1F568','E28011B0A5020066E5C1F568'],[2,'Right','BR','5C1F528','E28011B0A5020066E5C1F528'],
  [2,'Top','TL','5C1F5C8','E28011B0A5020066E5C1F5C8'],[2,'Top','TR','5C16FA8','E28011B0A5020066E5C16FA8'],[2,'Top','BL','5C25B08','E28011B0A5020066E5C25B08'],[2,'Top','BR','00B24D6','E2801191A5040076300B24D6'],
  [2,'Bottom','TL','00AB336','E2801191A5040076300AB336'],[2,'Bottom','TR','00A09F6','E2801191A5040076300A09F6'],[2,'Bottom','BL','5C28938','E28011B0A5020066E5C28938'],[2,'Bottom','BR','5C16FF8','E28011B0A5020066E5C16FF8'],
  // Box 3 — master-list verified (unchanged)
  [3,'Front','TL','5C25B98','E28011B0A5020066E5C25B98'],[3,'Front','TR','5C16F68','E28011B0A5020066E5C16F68'],[3,'Front','BL','5C12948','E28011B0A5020066E5C12948'],[3,'Front','BR','5C12988','E28011B0A5020066E5C12988'],
  [3,'Back','TL','5C28928','E28011B0A5020066E5C28928'],[3,'Back','TR','00A09B6','E2801191A5040076300A09B6'],[3,'Back','BL','00A0986','E2801191A5040076300A0986'],[3,'Back','BR','00A09C6','E2801191A5040076300A09C6'],
  [3,'Left','TL','5C26318','E28011B0A5020066E5C26318'],[3,'Left','TR','5C10368','E28011B0A5020066E5C10368'],[3,'Left','BL','5C26358','E28011B0A5020066E5C26358'],[3,'Left','BR','5C26328','E28011B0A5020066E5C26328'],
  [3,'Right','TL','5C10338','E28011B0A5020066E5C10338'],[3,'Right','TR','5C263A8','E28011B0A5020066E5C263A8'],[3,'Right','BL','5C263B8','E28011B0A5020066E5C263B8'],[3,'Right','BR','5C26368','E28011B0A5020066E5C26368'],
  [3,'Top','TL','00AB3B6','E2801191A5040076300AB3B6'],[3,'Top','TR','5C16F08','E28011B0A5020066E5C16F08'],[3,'Top','BL','5C25B48','E28011B0A5020066E5C25B48'],[3,'Top','BR','5C28968','E28011B0A5020066E5C28968'],
  [3,'Bottom','TL','5C25B88','E28011B0A5020066E5C25B88'],[3,'Bottom','TR','5C25BC8','E28011B0A5020066E5C25BC8'],[3,'Bottom','BL','5C28988','E28011B0A5020066E5C28988'],[3,'Bottom','BR','5C25BD8','E28011B0A5020066E5C25BD8'],
  // Box 4 — fully resolved after ground-truth scan enrichment
  [4,'Front','TL','1BD341A','E28011B0A5050070B1BD341A'],[4,'Front','TR','1BD34BA','E28011B0A5050070B1BD34BA'],[4,'Front','BL','1BD34AA','E28011B0A5050070B1BD34AA'],[4,'Front','BR','1BD348A','E28011B0A5050070B1BD348A'],
  [4,'Back','TL','1BE0E1A','E28011B0A5050070B1BE0E1A'],[4,'Back','TR','1BE0E8A','E28011B0A5050070B1BE0E8A'],[4,'Back','BL','28478D5','E28011B0A502006C028478D5'],[4,'Back','BR','284C095','E28011B0A502006C0284C095'],
  [4,'Left','TL','1BDBA9A','E28011B0A5050070B1BDBA9A'],[4,'Left','TR','1BDC20A','E28011B0A5050070B1BDC20A'],[4,'Left','BL','1BDE8AA','E28011B0A5050070B1BDE8AA'],[4,'Left','BR','1BDC2AA','E28011B0A5050070B1BDC2AA'],
  [4,'Right','TL','1BC883A','E28011B0A5050070B1BC883A'],[4,'Right','TR','1BE0E9A','E28011B0A5050070B1BE0E9A'],[4,'Right','BL','1BCAE9A','E28011B0A5050070B1BCAE9A'],[4,'Right','BR','1BCAE2A','E28011B0A5050070B1BCAE2A'],
  [4,'Top','TL','1BC62CA','E28011B0A5050070B1BC62CA'],[4,'Top','TR','1BC62DA','E28011B0A5050070B1BC62DA'],[4,'Top','BL','1BDE82A','E28011B0A5050070B1BDE82A'],[4,'Top','BR','1BDC28A','E28011B0A5050070B1BDC28A'],
  [4,'Bottom','TL','1BE94AA','E28011B0A5050070B1BE94AA'],[4,'Bottom','TR','1BE948A','E28011B0A5050070B1BE948A'],[4,'Bottom','BL','1BE0EBA','E28011B0A5050070B1BE0EBA'],[4,'Bottom','BR','1BE940A','E28011B0A5050070B1BE940A'],
  // Box 5 — Front + Right corrected from photo verification.
  // Back face: Ian photo-confirmed ONLY 1 physical tag on this face: TL = B2446.
  // Former TR/BL/BR slots (AB376/AB386/AB3C6) removed — not physically present.
  [5,'Front','TL','2845275','E28011B0A502006C02845275'],[5,'Front','TR','2844CD5','E28011B0A502006C02844CD5'],[5,'Front','BL','2844C85','E28011B0A502006C02844C85'],[5,'Front','BR','283A6D5','E28011B0A502006C0283A6D5'],
  [5,'Back','TL','B2446','E2801191A5040076300B2446'],
  [5,'Left','TL','283A684','E28011B0A502006C0283A684'],[5,'Left','TR','284C0E5','E28011B0A502006C0284C0E5'],[5,'Left','BL','284C695','E28011B0A502006C0284C695'],[5,'Left','BR','283A014','E28011B0A502006C0283A014'],
  [5,'Right','TL','28452D5','E28011B0A502006C028452D5'],[5,'Right','TR','2835884','E28011B0A502006C02835884'],[5,'Right','BL','2847874','E28011B0A502006C02847874'],[5,'Right','BR','283A0B5','E28011B0A502006C0283A0B5'],
  [5,'Top','TL','AF806','E2801191A5040076300AF806'],[5,'Top','TR','AB3F6','E2801191A5040076300AB3F6'],[5,'Top','BL','F886','E2801191A5040076300AF886'],[5,'Top','BR','F846','E2801191A5040076300AF846'],
  // Box 5 Bottom — swapped from Box 6 in DB (Ian photo-confirmed ODS values are correct).
  // Former DB entry F876/B2456/B2416/2486 physically belongs to Box 6 Bottom.
  [5,'Bottom','TL','284C664','E28011B0A502006C0284C664'],[5,'Bottom','TR','28478D4','E28011B0A502006C028478D4'],[5,'Bottom','BL','283A655','E28011B0A502006C0283A655'],[5,'Bottom','BR','28478E5','E28011B0A502006C028478E5'],
  // Box 6 — Front + Right corrected from photo verification.
  // Back face: B2446 was mis-entered here; Ian confirmed it belongs to Box 5 Back TL.
  // Box 6 Back has 0 confirmed physical tags — removed from DB.
  // Box 6 Top TR label was a raw full EPC — normalized to suffix + fullEpc
  [6,'Front','TL','6946','E2801191A5040076300B6946'],[6,'Front','TR','6916','E2801191A5040076300B6916'],[6,'Front','BL','AE56','E2801191A5040076300BAE56'],[6,'Front','BR','B69C6','E2801191A5040076300B69C6'],
  // Box 6 Back — no confirmed tags
  [6,'Left','TL','AE16','E2801191A5040076300BAE16'],[6,'Left','TR','6996','E2801191A5040076300B6996'],[6,'Left','BL','6906','E2801191A5040076300B6906'],[6,'Left','BR','6985','E2801191A5040076300B6985'],
  [6,'Right','TL','6986','E2801191A5040076300B6986'],[6,'Right','TR','AE46','E2801191A5040076300BAE46'],[6,'Right','BL','6956','E2801191A5040076300B6956'],[6,'Right','BR','AE06','E2801191A5040076300BAE06'],
  // Box 6 Top — ⚠ ODS updated from Ian photo but TR/BL/BR (AB3F6/F886/F846) duplicate
  // Box 5 Top — physically impossible. Possible Box5/Box6 Top swap (same pattern as
  // Bottom/Front/Right). Keeping old DB values pending verification.
  [6,'Top','TL','284C084','E28011B0A502006C0284C084'],[6,'Top','TR','2844C94','E28011B0A502006C02844C94'],[6,'Top','BL','28478E4','E28011B0A502006C028478E4'],[6,'Top','BR','284C0C4','E28011B0A502006C0284C0C4'],
  // Box 6 Bottom — swapped from Box 5 in DB (Ian photo-confirmed F876/B2456/B2416/2486).
  // Former DB entry 284C664/28478D4/283A655/28478E5 physically belongs to Box 5 Bottom.
  [6,'Bottom','TL','F876','E2801191A5040076300AF876'],[6,'Bottom','TR','B2456',null],[6,'Bottom','BL','B2416','E2801191A5040076300B2416'],[6,'Bottom','BR','2486','E2801191A5040076300B2486'],
  // Box 7 — Front TL verified by photo as 1BCAEBA; Top TR still a known duplicate.
  // Bottom labels were physically applied upside-down on the box; DB uses TL=1BC88BA
  // as the correct orientation anchor (Ian confirmed).
  [7,'Front','TL','1BCAEBA','E28011B0A5050070B1BCAEBA'],[7,'Front','TR','1BDBA0A','E28011B0A5050070B1BDBA0A'],[7,'Front','BL','1BDBAAA','E28011B0A5050070B1BDBAAA'],[7,'Front','BR','1BD349A','E28011B0A5050070B1BD349A'],
  [7,'Back','TL','2844C75','E28011B0A502006C02844C75'],[7,'Back','TR','2847885','E28011B0A502006C02847885'],[7,'Back','BL','2845285','E28011B0A502006C02845285'],[7,'Back','BR','2844CE5','E28011B0A502006C02844CE5'],
  [7,'Left','TL','1BDBA8A','E28011B0A5050070B1BDBA8A'],[7,'Left','TR','1BDC27A','E28011B0A5050070B1BDC27A'],[7,'Left','BL','1BDBA7A','E28011B0A5050070B1BDBA7A'],[7,'Left','BR','1BDC29A','E28011B0A5050070B1BDC29A'],
  [7,'Right','TL','F836','E2801191A5040076300AF836'],[7,'Right','TR','F8B6','E2801191A5040076300AF8B6'],[7,'Right','BL','B2406','E2801191A5040076300B2406'],[7,'Right','BR','F8C6','E2801191A5040076300AF8C6'],
  [7,'Top','TL','1BC625A','E28011B0A5050070B1BC625A'],[7,'Top','TR','1BCAEBA','E28011B0A5050070B1BCAEBA'],[7,'Top','BL','1BC62BA','E28011B0A5050070B1BC62BA'],[7,'Top','BR','1BC88AA','E28011B0A5050070B1BC88AA'],
  [7,'Bottom','TL','1BC88BA','E28011B0A5050070B1BC88BA'],[7,'Bottom','TR','1BC88DA','E28011B0A5050070B1BC88DA'],[7,'Bottom','BL','1BCAEAA','E28011B0A5050070B1BCAEAA'],[7,'Bottom','BR','1BCAECA','E28011B0A5050070B1BCAECA'],
  // Box 8 — Top TL '5C12988' Ian photo-confirmed. Full EPC assigned.
  // Duplicate with Box 3 Front BR is documented in the source sheet as a known
  // conflict — both carry the note '3/FRONT/BR and 8/TOP/TL duplicates'.
  // Front BR source label 'AB364' is physically the EPC ending 'AB346'.
  [8,'Front','TL','5C16F18','E28011B0A5020066E5C16F18'],[8,'Front','TR','5C16F58','E28011B0A5020066E5C16F58'],[8,'Front','BL','5C12908','E28011B0A5020066E5C12908'],[8,'Front','BR','AB346','E2801191A5040076300AB346'],
  [8,'Back','TL','1BE0EAA','E28011B0A5050070B1BE0EAA'],[8,'Back','TR','1BDE89A','E28011B0A5050070B1BDE89A'],[8,'Back','BL','1BDE8BA','E28011B0A5050070B1BDE8BA'],[8,'Back','BR','1BC5A0A','E28011B0A5050070B1BC5A0A'],
  [8,'Left','TL','1BBD4EA','E28011B0A5050070B1BBD4EA'],[8,'Left','TR','1BC620A','E28011B0A5050070B1BC620A'],[8,'Left','BL','1BC5ADA','E28011B0A5050070B1BC5ADA'],[8,'Left','BR','1BC5A5A','E28011B0A5050070B1BC5A5A'],
  [8,'Right','TL','5C263E8','E28011B0A5020066E5C263E8'],[8,'Right','TR','5C263F8','E28011B0A5020066E5C263F8'],[8,'Right','BL','5C103F8','E28011B0A5020066E5C103F8'],[8,'Right','BR','5C129C8','E28011B0A5020066E5C129C8'],
  [8,'Top','TL','5C12988','E28011B0A5020066E5C12988'],[8,'Top','TR','00A4E76','E2801191A5040076300A4E76'],[8,'Top','BL','5C129D8','E28011B0A5020066E5C129D8'],[8,'Top','BR','5C12938','E28011B0A5020066E5C12938'],
  [8,'Bottom','TL','1BC5ACA','E28011B0A5050070B1BC5ACA'],[8,'Bottom','TR','1BC62EA','E28011B0A5050070B1BC62EA'],[8,'Bottom','BL','1BDE8CA','E28011B0A5050070B1BDE8CA'],[8,'Bottom','BR','1BC5AEA','E28011B0A5050070B1BC5AEA'],
];

export const TEST_PLACEMENTS: ResolvedTagPlacement[] = RAW_PLACEMENTS.map(
  ([boxNumber, face, position, label, fullEpc]) => ({
    boxNumber: boxNumber as number,
    face: face as ResolvedTagPlacement['face'],
    position: position as ResolvedTagPlacement['position'],
    label: label as string,
    fullEpc: fullEpc ?? null,
  }),
);

// ─── Scenario placement database ─────────────────────────────────────────────
// Clean 192-tag synthetic set: every slot has a unique, valid EPC — no nulls,
// no duplicate labels, no missing face entries. Used ONLY by test scenarios;
// real CSV uploads continue to use TEST_PLACEMENTS (the physical placement DB).

const S_FACES     = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'] as const;
const S_POSITIONS = ['TL', 'TR', 'BL', 'BR'] as const;

/** Synthetic EPC — 20 zeros + 4-char hex counter (n = 1…192). 24 chars total. */
function sEpc(box: number, fi: number, pi: number): string {
  const n = (box - 1) * 24 + fi * 4 + pi + 1;
  return '00000000000000000000' + n.toString(16).toUpperCase().padStart(4, '0');
}

/** Clean 192-tag placement database for test scenarios. */
export const SCENARIO_PLACEMENTS: ResolvedTagPlacement[] = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((box) =>
  S_FACES.flatMap((face, fi) =>
    S_POSITIONS.map((pos, pi) => ({
      boxNumber: box,
      face:      face as ResolvedTagPlacement['face'],
      position:  pos  as ResolvedTagPlacement['position'],
      label:     `SIM${box}${fi}${pi}`,
      fullEpc:   sEpc(box, fi, pi),
    })),
  ),
);

// ─── Scenario read helpers ────────────────────────────────────────────────────

type SlotSpec = [fi: number, pi: number];

/** Convenience: generate SlotSpec pairs for a face index, optionally filtered. */
const sface = (fi: number, pis: number[] = [0, 1, 2, 3]): SlotSpec[] =>
  pis.map((pi): SlotSpec => [fi, pi]);

/** Build RunTagReads from (box, slots) specs with a per-box RSSI value. */
function makeReads(
  specs: { box: number; slots: SlotSpec[] }[],
  rssiByBox: Record<number, number>,
): RunTagRead[] {
  return specs.flatMap(({ box, slots }) =>
    slots.map(([fi, pi]): RunTagRead => {
      const epc = sEpc(box, fi, pi);
      return { rawEpc: epc, suffix: epc.slice(-7).toUpperCase(), rssi: rssiByBox[box]! };
    }),
  );
}

// ─── Scenario A — Large · 45° · 3ft · Max ────────────────────────────────────
// "Strong run" — optimal configuration. 174/192 = ~91% overall coverage.
// All 8 boxes >= 83% — all show GREEN at the 80% threshold.
//
// Physics (Large antenna, 45deg tilt, 3 ft, Max power):
//   NW/NE top boxes (1,2): 100% — closest to antenna, direct illumination at max
//     power means even bottom-face south-side tags get wrap-around reads.
//   SW/SE top boxes (3,4): 22/24 — bottom face south-side (BL/BR) in shadow;
//     the "B" row of the bottom face is on the south/back side, furthest from
//     a North-facing antenna.
//   NW/NE bottom boxes (5,6): 21/24 — top face partially shielded by box above
//     (miss BR corner); bottom face south-side still shadowed.
//   SW/SE bottom boxes (7,8): 20/24 — furthest from antenna; back face also
//     loses its BR corner (double-shadowed: south + layer attenuation).
//
// RSSI: -38 to -52 dBm (all strong green).

const SCENARIO_A_SPECS: { box: number; slots: SlotSpec[] }[] = [
  // NW Top (Box 1): 24/24 — perfect reads; max power + 3ft = wrap-around on all faces
  { box: 1, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4), ...sface(5)] },
  // NE Top (Box 2): 24/24 — same as Box 1
  { box: 2, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4), ...sface(5)] },
  // SW Top (Box 3): 22/24 — Bottom south-side (BL/BR at index 2,3) enters shadow zone
  { box: 3, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4), ...sface(5, [0, 1])] },
  // SE Top (Box 4): 22/24 — same bottom shadow pattern
  { box: 4, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4), ...sface(5, [0, 1])] },
  // NW Bottom (Box 5): 21/24 — Top face loses BR (shielded by Box 1); Bottom south-side
  { box: 5, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4, [0, 1, 2]), ...sface(5, [0, 1])] },
  // NE Bottom (Box 6): 21/24 — same as Box 5 (shielded by Box 2)
  { box: 6, slots: [...sface(0), ...sface(1), ...sface(2), ...sface(3), ...sface(4, [0, 1, 2]), ...sface(5, [0, 1])] },
  // SW Bottom (Box 7): 20/24 — Back also loses BR (SW corner furthest); Top loses BR
  { box: 7, slots: [...sface(0), ...sface(1, [0, 1, 2]), ...sface(2), ...sface(3), ...sface(4, [0, 1, 2]), ...sface(5, [0, 1])] },
  // SE Bottom (Box 8): 20/24 — same as Box 7; SE = furthest overall from antenna axis
  { box: 8, slots: [...sface(0), ...sface(1, [0, 1, 2]), ...sface(2), ...sface(3), ...sface(4, [0, 1, 2]), ...sface(5, [0, 1])] },
];

const RSSI_A: Record<number, number> = {
  1: -40, 2: -38, 3: -44, 4: -46,
  5: -48, 6: -46, 7: -52, 8: -50,
};

// ─── Scenario B — Medium · 0° · 6ft · Base ───────────────────────────────────
// "Distance penalty" — per-tag RSSI gradient. 62/192 = ~32% overall coverage.
// All 8 boxes red. Spatial pattern: signal radiates from the Top-Right edge
// (boxes 2,4) and Top-Left edge (boxes 1,3), decaying outward per tag.
//
//   Box 1 NW Top   50%  strong Top-Left edge, decays across Top + Front
//   Box 2 NE Top   50%  strong Top-Right edge, decays across Top + Front
//   Box 3 SW Top   46%  same as Box 1 but weaker (further south)
//   Box 4 SE Top   46%  same as Box 2 but weaker (further south)
//   Box 5 NW Bot   17%  Top-Left edge barely read, everything else missed
//   Box 6 NE Bot   17%  Top-Right edge barely read, everything else missed
//   Box 7 SW Bot   17%  Top-Left edge barely read, everything else missed
//   Box 8 SE Bot   17%  Top-Right edge barely read, everything else missed
//
// Physics (Medium antenna, 0° flat, 6ft, Base power):
//   At 6ft base power, signal barely reaches the rig at all.
//   Strongest reads: Top face tags on the antenna-proximal edge (centre of rig)
//   plus the adjacent side face top row — total 4 "primary" tags per box.
//   Signal decays outward: remaining Top tags are medium-weak, Front reads
//   are tertiary, Back/Bottom are total blind spots at this range.
//   Bottom layer additionally attenuated ~-3 dB by top-layer shielding.
//
// RSSI: -54 to -76 dBm (primary edge green-ish, everything else red).

// Per-slot RSSI support for Scenario B — [faceIdx, posIdx, rssi].
// face: 0=Front 1=Back 2=Left 3=Right 4=Top 5=Bottom
// pos:  0=TL    1=TR   2=BL   3=BR
type DetailedSlotSpec = [fi: number, pi: number, rssi: number];

function makeDetailedReads(
  specs: { box: number; slots: DetailedSlotSpec[] }[],
): RunTagRead[] {
  return specs.flatMap(({ box, slots }) =>
    slots.map(([fi, pi, rssi]): RunTagRead => {
      const epc = sEpc(box, fi, pi);
      return { rawEpc: epc, suffix: epc.slice(-7).toUpperCase(), rssi };
    }),
  );
}

// prettier-ignore
const SCENARIO_B_DETAILED: { box: number; slots: DetailedSlotSpec[] }[] = [
  // ── NW Top (Box 1) — UPPER/LEFT EDGE primary, radiates right + front ──────
  // Primary: Top-TL + Top-BL share edge with Left face; Left-TL + Left-TR top row
  { box: 1, slots: [
    [4, 0, -54], [4, 2, -56], [2, 0, -56], [2, 1, -58], // primary edge
    [4, 1, -64], [4, 3, -67], [2, 2, -63], [2, 3, -68], // Top right half + Left bottom
    [0, 0, -61], [0, 2, -64], [0, 1, -68], [0, 3, -70], // Front (N-facing)
  ]},
  // ── NE Top (Box 2) — UPPER/RIGHT EDGE primary, radiates left + front ──────
  // Primary: Top-TR + Top-BR share edge with Right face; Right-TL + Right-TR top row
  { box: 2, slots: [
    [4, 1, -54], [4, 3, -56], [3, 0, -56], [3, 1, -58], // primary edge
    [4, 0, -64], [4, 2, -67], [3, 2, -63], [3, 3, -68], // Top left half + Right bottom
    [0, 1, -61], [0, 3, -64], [0, 0, -68], [0, 2, -70], // Front (N-facing)
  ]},
  // ── SW Top (Box 3) — same as Box 1 but ~-2 dB further south ─────────────
  { box: 3, slots: [
    [4, 0, -56], [4, 2, -58], [2, 0, -58], [2, 1, -60], // primary edge
    [4, 1, -66], [4, 3, -69], [2, 2, -66], [2, 3, -71], // Top right half + Left bottom
    [0, 0, -64], [0, 2, -67], [0, 1, -71],               // Front (fewer tertiary reads)
  ]},
  // ── SE Top (Box 4) — same as Box 2 but ~-2 dB further south ─────────────
  { box: 4, slots: [
    [4, 1, -56], [4, 3, -58], [3, 0, -58], [3, 1, -60], // primary edge
    [4, 0, -66], [4, 2, -69], [3, 2, -66], [3, 3, -71], // Top left half + Right bottom
    [0, 1, -64], [0, 3, -67], [0, 0, -71],               // Front (fewer tertiary reads)
  ]},
  // ── NW Bottom (Box 5) — Top-Left edge only, near threshold ───────────────
  { box: 5, slots: [
    [4, 0, -71], [4, 2, -73], [2, 0, -73], [2, 1, -74],
  ]},
  // ── NE Bottom (Box 6) — Top-Right edge only, near threshold ──────────────
  { box: 6, slots: [
    [4, 1, -71], [4, 3, -73], [3, 0, -73], [3, 1, -74],
  ]},
  // ── SW Bottom (Box 7) — Top-Left edge barely, ~-2 dB vs Box 5 ───────────
  { box: 7, slots: [
    [4, 0, -73], [4, 2, -75], [2, 0, -75], [2, 1, -76],
  ]},
  // ── SE Bottom (Box 8) — Top-Right edge barely, ~-2 dB vs Box 6 ──────────
  { box: 8, slots: [
    [4, 1, -73], [4, 3, -75], [3, 0, -75], [3, 1, -76],
  ]},
];

// ─── Scenario objects ─────────────────────────────────────────────────────────

export interface TestScenario {
  label:      string;
  meta:       RunMeta;
  reads:      RunTagRead[];
  placements: ResolvedTagPlacement[];
}

export const SCENARIO_A: TestScenario = {
  label:      'Example A \u2014 Strong (Large \u00b7 45\u00b0 \u00b7 3ft \u00b7 Max)',
  meta:       { name: 'Example A', antenna: 'Large', orientation: '45\u00b0', range: '3ft', power: 'Max' },
  reads:      makeReads(SCENARIO_A_SPECS, RSSI_A),
  placements: SCENARIO_PLACEMENTS,
};

export const SCENARIO_B: TestScenario = {
  label:      'Example B \u2014 Weak (Medium \u00b7 0\u00b0 \u00b7 6ft \u00b7 Base)',
  meta:       { name: 'Example B', antenna: 'Medium', orientation: '0\u00b0', range: '6ft', power: 'Base' },
  reads:      makeDetailedReads(SCENARIO_B_DETAILED),
  placements: SCENARIO_PLACEMENTS,
};
