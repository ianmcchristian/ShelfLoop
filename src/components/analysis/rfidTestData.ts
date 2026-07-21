// ─── RFID Baked Test Data ─────────────────────────────────────────────────────
// Derived from "Box vs Tag Database" CSV + scan file 3ft0largefront30s_unique.csv
// (142 unique EPCs). Full EPCs resolved by matching last-7-char label suffixes.
//
// Discrepancies flagged in comments:
//   • Box 5 Left BR + Right TL share label '6986' — data entry error, EPC
//     assigned to Left BR only, Right TL left null.
//   • Box 3 Front BR + Box 8 Top TL share label '5C12988' — same physical tag
//     cannot occupy two boxes; Box 3 is verified, Box 8 Top TL left null.
//   • 4 EPCs in scan matched no placement slot (unexpected reads):
//     1BC88CA, 5C12998, 00AB346, 00AB306 — will surface in Exceptions panel.
//   • Box 5 Back TL 'AB336' overlaps Box 2 Bottom TL's EPC suffix — left null.
//
// Mock run simulates ~75% read rate on boxes 2 & 3, patchy elsewhere.

import type { ResolvedTagPlacement, RunMeta, RunTagRead } from './rfidTypes';

// ─── Placement database ───────────────────────────────────────────────────────
// Format: [boxNumber, face, position, label, fullEpc | null]
// prettier-ignore
const RAW_PLACEMENTS: [number, string, string, string, string | null][] = [
  // Box 1 — 20/24 resolved; 4 not present in this scan (283A074, 27C8066, 283A6C5, 2847875)
  [1,'Front','TL','283A0A5','E28011B0A502006C0283A0A5'],[1,'Front','TR','28452D4','E28011B0A502006C028452D4'],[1,'Front','BL','283A055','E28011B0A502006C0283A055'],[1,'Front','BR','283A674','E28011B0A502006C0283A674'],
  [1,'Back','TL','28452C4','E28011B0A502006C028452C4'],[1,'Back','TR','2845224','E28011B0A502006C02845224'],[1,'Back','BL','2844C84','E28011B0A502006C02844C84'],[1,'Back','BR','2844C34','E28011B0A502006C02844C34'],
  [1,'Left','TL','2847884','E28011B0A502006C02847884'],[1,'Left','TR','2835895','E28011B0A502006C02835895'],[1,'Left','BL','284C654','E28011B0A502006C0284C654'],[1,'Left','BR','284C0B4','E28011B0A502006C0284C0B4'],
  [1,'Right','TL','2844C24','E28011B0A502006C02844C24'],[1,'Right','TR','2845234','E28011B0A502006C02845234'],[1,'Right','BL','28452E5','E28011B0A502006C028452E5'],[1,'Right','BR','27C8006','E28011B0A502006C027C8006'],
  [1,'Top','TL','283A045','E28011B0A502006C0283A045'],[1,'Top','TR','283A074',null],[1,'Top','BL','284C6A5','E28011B0A502006C0284C6A5'],[1,'Top','BR','284C0F5','E28011B0A502006C0284C0F5'],
  [1,'Bottom','TL','27C8066',null],[1,'Bottom','TR','283A6C5',null],[1,'Bottom','BL','2847875',null],[1,'Bottom','BR','284C085','E28011B0A502006C0284C085'],
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
  // Box 4 — 20/24 resolved; 4 not in scan (1BDBA9A, 1BE0E8A, 1BE0E9A, 1BE940A)
  [4,'Front','TL','1BD341A','E28011B0A5050070B1BD341A'],[4,'Front','TR','1BD34BA','E28011B0A5050070B1BD34BA'],[4,'Front','BL','1BD34AA','E28011B0A5050070B1BD34AA'],[4,'Front','BR','1BD348A','E28011B0A5050070B1BD348A'],
  [4,'Back','TL','1BE0E1A','E28011B0A5050070B1BE0E1A'],[4,'Back','TR','1BE0E8A',null],[4,'Back','BL','28478D5','E28011B0A502006C028478D5'],[4,'Back','BR','284C095','E28011B0A502006C0284C095'],
  [4,'Left','TL','1BDBA9A',null],[4,'Left','TR','1BDC20A','E28011B0A5050070B1BDC20A'],[4,'Left','BL','1BDE8AA','E28011B0A5050070B1BDE8AA'],[4,'Left','BR','1BDC2AA','E28011B0A5050070B1BDC2AA'],
  [4,'Right','TL','1BC883A','E28011B0A5050070B1BC883A'],[4,'Right','TR','1BE0E9A',null],[4,'Right','BL','1BCAE9A','E28011B0A5050070B1BCAE9A'],[4,'Right','BR','1BCAE2A','E28011B0A5050070B1BCAE2A'],
  [4,'Top','TL','1BC62CA','E28011B0A5050070B1BC62CA'],[4,'Top','TR','1BC62DA','E28011B0A5050070B1BC62DA'],[4,'Top','BL','1BDE82A','E28011B0A5050070B1BDE82A'],[4,'Top','BR','1BDC28A','E28011B0A5050070B1BDC28A'],
  [4,'Bottom','TL','1BE94AA','E28011B0A5050070B1BE94AA'],[4,'Bottom','TR','1BE948A','E28011B0A5050070B1BE948A'],[4,'Bottom','BL','1BE0EBA','E28011B0A5050070B1BE0EBA'],[4,'Bottom','BR','1BE940A',null],
  // Box 5 — short labels, different tag batch; many partial matches
  // DISCREPANCY: Left BR + Right TL both labeled '6986' — EPC assigned to Left BR only
  // DISCREPANCY: Back TL 'AB336' overlaps Box 2 Bottom TL EPC suffix — left null
  [5,'Front','TL','6946','E2801191A5040076300B6946'],[5,'Front','TR','6916','E2801191A5040076300B6916'],[5,'Front','BL','AE56','E2801191A5040076300BAE56'],[5,'Front','BR','B69C6','E2801191A5040076300B69C6'],
  [5,'Back','TL','AB336',null],[5,'Back','TR','AB376','E2801191A5040076300AB376'],[5,'Back','BL','AB386','E2801191A5040076300AB386'],[5,'Back','BR','AB3C6','E2801191A5040076300AB3C6'],
  [5,'Left','TL','AE16','E2801191A5040076300BAE16'],[5,'Left','TR','6996',null],[5,'Left','BL','6906','E2801191A5040076300B6906'],[5,'Left','BR','6986','E2801191A5040076300B6986'],
  [5,'Right','TL','6986',null],[5,'Right','TR','AE46',null],[5,'Right','BL','6956','E2801191A5040076300B6956'],[5,'Right','BR','AE06',null],
  [5,'Top','TL','AF806',null],[5,'Top','TR','AB3F6',null],[5,'Top','BL','F886','E2801191A5040076300AF886'],[5,'Top','BR','F846',null],
  [5,'Bottom','TL','F876',null],[5,'Bottom','TR','B2456',null],[5,'Bottom','BL','B2416',null],[5,'Bottom','BR','2486',null],
  // Box 6 — 15/21 resolved; Box 6 Back only has 1 slot in source data
  // Box 6 Top TR label was a raw full EPC — normalized to suffix + fullEpc
  [6,'Front','TL','2845275','E28011B0A502006C02845275'],[6,'Front','TR','2844CD5','E28011B0A502006C02844CD5'],[6,'Front','BL','2844C85','E28011B0A502006C02844C85'],[6,'Front','BR','283A6D5','E28011B0A502006C0283A6D5'],
  [6,'Back','TL','B2446','E2801191A5040076300B2446'],
  [6,'Left','TL','283A684','E28011B0A502006C0283A684'],[6,'Left','TR','284C0E5','E28011B0A502006C0284C0E5'],[6,'Left','BL','284C695','E28011B0A502006C0284C695'],[6,'Left','BR','283A014','E28011B0A502006C0283A014'],
  [6,'Right','TL','28452D5',null],[6,'Right','TR','2835884','E28011B0A502006C02835884'],[6,'Right','BL','2847874','E28011B0A502006C02847874'],[6,'Right','BR','283A0B5','E28011B0A502006C0283A0B5'],
  [6,'Top','TL','284C084','E28011B0A502006C0284C084'],[6,'Top','TR','2844C94','E28011B0A502006C02844C94'],[6,'Top','BL','28478E4','E28011B0A502006C028478E4'],[6,'Top','BR','284C0C4',null],
  [6,'Bottom','TL','284C664','E28011B0A502006C0284C664'],[6,'Bottom','TR','28478D4',null],[6,'Bottom','BL','283A655',null],[6,'Bottom','BR','28478E5',null],
  // Box 7 — 23/24 resolved; Front TL '1326' is a truncated label with no match
  [7,'Front','TL','1326',null],[7,'Front','TR','1BDBA0A','E28011B0A5050070B1BDBA0A'],[7,'Front','BL','1BDBAAA','E28011B0A5050070B1BDBAAA'],[7,'Front','BR','1BD349A','E28011B0A5050070B1BD349A'],
  [7,'Back','TL','2844C75','E28011B0A502006C02844C75'],[7,'Back','TR','2847885','E28011B0A502006C02847885'],[7,'Back','BL','2845285','E28011B0A502006C02845285'],[7,'Back','BR','2844CE5','E28011B0A502006C02844CE5'],
  [7,'Left','TL','1BDBA8A','E28011B0A5050070B1BDBA8A'],[7,'Left','TR','1BDC27A','E28011B0A5050070B1BDC27A'],[7,'Left','BL','1BDBA7A','E28011B0A5050070B1BDBA7A'],[7,'Left','BR','1BDC29A','E28011B0A5050070B1BDC29A'],
  [7,'Right','TL','F836','E2801191A5040076300AF836'],[7,'Right','TR','F8B6','E2801191A5040076300AF8B6'],[7,'Right','BL','B2406','E2801191A5040076300B2406'],[7,'Right','BR','F8C6','E2801191A5040076300AF8C6'],
  [7,'Top','TL','1BC625A','E28011B0A5050070B1BC625A'],[7,'Top','TR','1BCAEBA','E28011B0A5050070B1BCAEBA'],[7,'Top','BL','1BC62BA','E28011B0A5050070B1BC62BA'],[7,'Top','BR','1BC88AA','E28011B0A5050070B1BC88AA'],
  [7,'Bottom','TL','1BCAECA','E28011B0A5050070B1BCAECA'],[7,'Bottom','TR','1BCAEAA','E28011B0A5050070B1BCAEAA'],[7,'Bottom','BL','1BC88DA','E28011B0A5050070B1BC88DA'],[7,'Bottom','BR','1BC88BA','E28011B0A5050070B1BC88BA'],
  // Box 8 — expanded from partial; DISCREPANCY: Top TL '5C12988' duplicates Box 3 Front BR
  [8,'Front','TL','5C16F18','E28011B0A5020066E5C16F18'],[8,'Front','TR','5C16F58','E28011B0A5020066E5C16F58'],[8,'Front','BL','5C12908','E28011B0A5020066E5C12908'],[8,'Front','BR','AB364',null],
  [8,'Back','TL','1BE0EAA','E28011B0A5050070B1BE0EAA'],[8,'Back','TR','1BDE89A','E28011B0A5050070B1BDE89A'],[8,'Back','BL','1BDE8BA','E28011B0A5050070B1BDE8BA'],[8,'Back','BR','1BC5A0A','E28011B0A5050070B1BC5A0A'],
  [8,'Left','TL','1BBD4EA','E28011B0A5050070B1BBD4EA'],[8,'Left','TR','1BC620A','E28011B0A5050070B1BC620A'],[8,'Left','BL','1BC5ADA','E28011B0A5050070B1BC5ADA'],[8,'Left','BR','1BC5A5A','E28011B0A5050070B1BC5A5A'],
  [8,'Right','TL','5C263E8','E28011B0A5020066E5C263E8'],[8,'Right','TR','5C263F8','E28011B0A5020066E5C263F8'],[8,'Right','BL','5C103F8','E28011B0A5020066E5C103F8'],[8,'Right','BR','5C129C8','E28011B0A5020066E5C129C8'],
  [8,'Top','TL','5C12988',null],[8,'Top','TR','00A4E76','E2801191A5040076300A4E76'],[8,'Top','BL','5C129D8','E28011B0A5020066E5C129D8'],[8,'Top','BR','5C12938','E28011B0A5020066E5C12938'],
  [8,'Bottom','TL','1BC5ACA',null],[8,'Bottom','TR','1BC62EA',null],[8,'Bottom','BL','1BDE8CA','E28011B0A5050070B1BDE8CA'],[8,'Bottom','BR','1BC5AEA',null],
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

// ─── Scenario A — Large · 45° · 3ft · Max ────────────────────────────────────
// "Strong run" — optimal configuration. ~77% coverage (148/192 tags).
// Physics: strong signal, wide beam, close range. Near-perfect on front/side/top
// faces. Back faces mostly covered. Bottom faces are the consistent weak point.
// RSSI range: -38 to -52 dBm (mostly green).

const SCENARIO_A_EPCS: string[] = [
  // Box 1 — NW Top (19/20 resolved — miss Back BR)
  'E28011B0A502006C0283A0A5','E28011B0A502006C028452D4','E28011B0A502006C0283A055','E28011B0A502006C0283A674', // Front
  'E28011B0A502006C028452C4','E28011B0A502006C02845224','E28011B0A502006C02844C84',                              // Back TL/TR/BL
  'E28011B0A502006C02847884','E28011B0A502006C02835895','E28011B0A502006C0284C654','E28011B0A502006C0284C0B4', // Left
  'E28011B0A502006C02844C24','E28011B0A502006C02845234','E28011B0A502006C028452E5','E28011B0A502006C027C8006', // Right
  'E28011B0A502006C0283A045','E28011B0A502006C0284C6A5','E28011B0A502006C0284C0F5',                          // Top TL/BL/BR
  'E28011B0A502006C0284C085',                                                                                 // Bottom BR
  // Box 2 — NE Top (21/24 — miss Back BR + Bottom TL/BR)
  'E28011B0A5020066E5C289B8','E28011B0A5020066E5C10388','E28011B0A5020066E5C16FB8','E28011B0A5020066E5C16FE8', // Front
  'E2801191A5040076300B24C6','E28011B0A5020066E5C25B38','E2801191A5040076300B2496',                          // Back TL/TR/BL
  'E2801191A5040076300A4E36','E2801191A5040076300A4E46','E28011B0A5020066E5C1F538','E2801191A5040076300A4E06', // Left
  'E28011B0A5020066E5C1F5B8','E28011B0A5020066E5C1F588','E28011B0A5020066E5C1F568','E28011B0A5020066E5C1F528', // Right
  'E28011B0A5020066E5C1F5C8','E28011B0A5020066E5C16FA8','E28011B0A5020066E5C25B08','E2801191A5040076300B24D6', // Top
  'E2801191A5040076300A09F6','E28011B0A5020066E5C28938',                                                     // Bottom TR/BL
  // Box 3 — SW Top (21/24 — miss Back BR + Bottom TR/BL)
  'E28011B0A5020066E5C25B98','E28011B0A5020066E5C16F68','E28011B0A5020066E5C12948','E28011B0A5020066E5C12988', // Front
  'E28011B0A5020066E5C28928','E2801191A5040076300A09B6','E2801191A5040076300A0986',                          // Back TL/TR/BL
  'E28011B0A5020066E5C26318','E28011B0A5020066E5C10368','E28011B0A5020066E5C26358','E28011B0A5020066E5C26328', // Left
  'E28011B0A5020066E5C10338','E28011B0A5020066E5C263A8','E28011B0A5020066E5C263B8','E28011B0A5020066E5C26368', // Right
  'E2801191A5040076300AB3B6','E28011B0A5020066E5C16F08','E28011B0A5020066E5C25B48','E28011B0A5020066E5C28968', // Top
  'E28011B0A5020066E5C25B88','E28011B0A5020066E5C25BD8',                                                     // Bottom TL/BR
  // Box 4 — SE Top (18/20 resolved — miss Bottom BL)
  'E28011B0A5050070B1BD341A','E28011B0A5050070B1BD34BA','E28011B0A5050070B1BD34AA','E28011B0A5050070B1BD348A', // Front
  'E28011B0A5050070B1BE0E1A','E28011B0A502006C028478D5','E28011B0A502006C0284C095',                          // Back TL/BL/BR
  'E28011B0A5050070B1BDC20A','E28011B0A5050070B1BDE8AA','E28011B0A5050070B1BDC2AA',                          // Left TR/BL/BR
  'E28011B0A5050070B1BC883A','E28011B0A5050070B1BCAE9A','E28011B0A5050070B1BCAE2A',                          // Right TL/BL/BR
  'E28011B0A5050070B1BC62CA','E28011B0A5050070B1BC62DA','E28011B0A5050070B1BDE82A','E28011B0A5050070B1BDC28A', // Top
  'E28011B0A5050070B1BE94AA','E28011B0A5050070B1BE948A',                                                     // Bottom TL/TR
  // Box 5 — NW Bottom (12/12 resolved — all resolvable tags read)
  'E2801191A5040076300B6946','E2801191A5040076300B6916','E2801191A5040076300BAE56','E2801191A5040076300B69C6', // Front
  'E2801191A5040076300AB376','E2801191A5040076300AB386','E2801191A5040076300AB3C6',                          // Back TR/BL/BR
  'E2801191A5040076300BAE16','E2801191A5040076300B6906','E2801191A5040076300B6986',                          // Left TL/BL/BR
  'E2801191A5040076300B6956',                                                                                 // Right BL
  'E2801191A5040076300AF886',                                                                                 // Top BL
  // Box 6 — NE Bottom (17/17 resolved — all resolvable tags read)
  'E28011B0A502006C02845275','E28011B0A502006C02844CD5','E28011B0A502006C02844C85','E28011B0A502006C0283A6D5', // Front
  'E2801191A5040076300B2446',                                                                                 // Back TL
  'E28011B0A502006C0283A684','E28011B0A502006C0284C0E5','E28011B0A502006C0284C695','E28011B0A502006C0283A014', // Left
  'E28011B0A502006C02835884','E28011B0A502006C02847874','E28011B0A502006C0283A0B5',                          // Right TR/BL/BR
  'E28011B0A502006C0284C084','E28011B0A502006C02844C94','E28011B0A502006C028478E4',                          // Top TL/TR/BL
  'E28011B0A502006C0284C664',                                                                                 // Bottom TL
  // Box 7 — SW Bottom (21/23 resolved — miss Bottom TR/BR)
  'E28011B0A5050070B1BDBA0A','E28011B0A5050070B1BDBAAA','E28011B0A5050070B1BD349A',                          // Front TR/BL/BR
  'E28011B0A502006C02844C75','E28011B0A502006C02847885','E28011B0A502006C02845285','E28011B0A502006C02844CE5', // Back
  'E28011B0A5050070B1BDBA8A','E28011B0A5050070B1BDC27A','E28011B0A5050070B1BDBA7A','E28011B0A5050070B1BDC29A', // Left
  'E2801191A5040076300AF836','E2801191A5040076300AF8B6','E2801191A5040076300B2406','E2801191A5040076300AF8C6',  // Right
  'E28011B0A5050070B1BC625A','E28011B0A5050070B1BCAEBA','E28011B0A5050070B1BC62BA','E28011B0A5050070B1BC88AA', // Top
  'E28011B0A5050070B1BCAECA','E28011B0A5050070B1BC88DA',                                                     // Bottom TL/BL
  // Box 8 — SE Bottom (19/19 resolved — all resolvable tags read)
  'E28011B0A5020066E5C16F18','E28011B0A5020066E5C16F58','E28011B0A5020066E5C12908',                          // Front TL/TR/BL
  'E28011B0A5050070B1BE0EAA','E28011B0A5050070B1BDE89A','E28011B0A5050070B1BDE8BA','E28011B0A5050070B1BC5A0A', // Back
  'E28011B0A5050070B1BBD4EA','E28011B0A5050070B1BC620A','E28011B0A5050070B1BC5ADA','E28011B0A5050070B1BC5A5A', // Left
  'E28011B0A5020066E5C263E8','E28011B0A5020066E5C263F8','E28011B0A5020066E5C103F8','E28011B0A5020066E5C129C8', // Right
  'E2801191A5040076300A4E76','E28011B0A5020066E5C129D8','E28011B0A5020066E5C12938',                          // Top TR/BL/BR
  'E28011B0A5050070B1BDE8CA',                                                                                 // Bottom BL
];

// ─── Scenario B — Medium · 0° · 6ft · Base ───────────────────────────────────
// "Distance penalty" — challenging configuration. ~39% coverage (74/192 tags).
// Physics: weaker signal, flat beam, double the range, base power. Front faces
// of near boxes (NW/NE) still readable. SW/SE bottom boxes are near-blind.
// Clear spatial falloff pattern makes blind spots immediately obvious in the rig.
// RSSI range: -58 to -78 dBm (mostly red).

const SCENARIO_B_EPCS: string[] = [
  // Box 1 — NW Top (10/20 — front face + near-side TL/TR only)
  'E28011B0A502006C0283A0A5','E28011B0A502006C028452D4','E28011B0A502006C0283A055','E28011B0A502006C0283A674', // Front
  'E28011B0A502006C028452C4',                                                                                 // Back TL only
  'E28011B0A502006C02847884','E28011B0A502006C02835895',                                                     // Left TL/TR
  'E28011B0A502006C02844C24','E28011B0A502006C02845234',                                                     // Right TL/TR
  'E28011B0A502006C0283A045',                                                                                 // Top TL only
  // Box 2 — NE Top (18/24 — best box at this range, most faces partially covered)
  'E28011B0A5020066E5C289B8','E28011B0A5020066E5C10388','E28011B0A5020066E5C16FB8','E28011B0A5020066E5C16FE8', // Front
  'E2801191A5040076300B24C6','E28011B0A5020066E5C25B38',                                                     // Back TL/TR
  'E2801191A5040076300A4E36','E2801191A5040076300A4E46','E28011B0A5020066E5C1F538',                          // Left TL/TR/BL
  'E28011B0A5020066E5C1F5B8','E28011B0A5020066E5C1F588','E28011B0A5020066E5C1F568','E28011B0A5020066E5C1F528', // Right
  'E28011B0A5020066E5C1F5C8','E28011B0A5020066E5C16FA8','E28011B0A5020066E5C25B08','E2801191A5040076300B24D6', // Top
  'E2801191A5040076300A09F6',                                                                                 // Bottom TR only
  // Box 3 — SW Top (10/24 — front face + lead edges of sides, no back, no bottom)
  'E28011B0A5020066E5C25B98','E28011B0A5020066E5C16F68','E28011B0A5020066E5C12948',                          // Front TL/TR/BL
  'E28011B0A5020066E5C28928',                                                                                 // Back TL only
  'E28011B0A5020066E5C26318','E28011B0A5020066E5C10368',                                                     // Left TL/TR
  'E28011B0A5020066E5C10338','E28011B0A5020066E5C263A8',                                                     // Right TL/TR
  'E2801191A5040076300AB3B6','E28011B0A5020066E5C25B48',                                                     // Top TL/BL
  // Box 4 — SE Top (10/20 — front face + sparse coverage elsewhere)
  'E28011B0A5050070B1BD341A','E28011B0A5050070B1BD34BA','E28011B0A5050070B1BD34AA','E28011B0A5050070B1BD348A', // Front
  'E28011B0A5050070B1BE0E1A',                                                                                 // Back TL only
  'E28011B0A5050070B1BDC20A',                                                                                 // Left TR only
  'E28011B0A5050070B1BC883A',                                                                                 // Right TL only
  'E28011B0A5050070B1BC62CA','E28011B0A5050070B1BC62DA',                                                     // Top TL/TR
  'E28011B0A5050070B1BE94AA',                                                                                 // Bottom TL only
  // Box 5 — NW Bottom (6/12 — front face mostly, 1 back, 1 left)
  'E2801191A5040076300B6946','E2801191A5040076300B6916','E2801191A5040076300BAE56',                          // Front TL/TR/BL
  'E2801191A5040076300AB376','E2801191A5040076300AB386',                                                     // Back TR/BL
  'E2801191A5040076300BAE16',                                                                                 // Left TL only
  // Box 6 — NE Bottom (12/17 — best bottom box; front + sides partially covered)
  'E28011B0A502006C02845275','E28011B0A502006C02844CD5','E28011B0A502006C02844C85','E28011B0A502006C0283A6D5', // Front
  'E2801191A5040076300B2446',                                                                                 // Back TL
  'E28011B0A502006C0283A684','E28011B0A502006C0284C0E5','E28011B0A502006C0284C695',                          // Left TL/TR/BL
  'E28011B0A502006C02835884','E28011B0A502006C02847874',                                                     // Right TR/BL
  'E28011B0A502006C0284C084','E28011B0A502006C02844C94',                                                     // Top TL/TR
  // Box 7 — SW Bottom (5/23 — severe falloff; front face edge + single slots)
  'E28011B0A5050070B1BDBA0A','E28011B0A5050070B1BDBAAA',                                                     // Front TR/BL
  'E28011B0A5050070B1BDBA8A',                                                                                 // Left TL only
  'E28011B0A5050070B1BC625A',                                                                                 // Top TL only
  'E28011B0A5050070B1BCAECA',                                                                                 // Bottom TL only
  // Box 8 — SE Bottom (3/19 — near-total blind spot; only front TL/TR + 1 left)
  'E28011B0A5020066E5C16F18','E28011B0A5020066E5C16F58',                                                     // Front TL/TR
  'E28011B0A5050070B1BBD4EA',                                                                                 // Left TL only
];

// ─── Scenario objects ─────────────────────────────────────────────────────────

const RSSI_A = [-38, -42, -44, -46, -48, -40, -51, -43, -47, -39] as const; // strong: mostly green
const RSSI_B = [-58, -62, -65, -68, -71, -60, -74, -66, -72, -78] as const; // weak:   mostly red

function toReads(epcs: string[], rssiCycle: readonly number[]): RunTagRead[] {
  return epcs.map((epc, i) => ({
    rawEpc: epc,
    suffix: epc.slice(-7).toUpperCase(),
    rssi:   rssiCycle[i % rssiCycle.length],
  }));
}

export interface TestScenario {
  label: string;
  meta:  RunMeta;
  reads: RunTagRead[];
}

export const SCENARIO_A: TestScenario = {
  label: 'Example A — Strong (Large · 45° · 3ft · Max)',
  meta: { name: 'Example A', antenna: 'Large', orientation: '45°', range: '3ft', power: 'Max' },
  reads: toReads(SCENARIO_A_EPCS, RSSI_A),
};

export const SCENARIO_B: TestScenario = {
  label: 'Example B — Weak (Medium · 0° · 6ft · Base)',
  meta: { name: 'Example B', antenna: 'Medium', orientation: '0°', range: '6ft', power: 'Base' },
  reads: toReads(SCENARIO_B_EPCS, RSSI_B),
};
