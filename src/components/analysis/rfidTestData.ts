// ─── RFID Baked Test Data ─────────────────────────────────────────────────────
// Derived from "Box vs Tag Database" CSV + Tag Master List.
// Labels are last-7-char suffixes. Full EPCs filled where master list confirms.
// Swap this out once the canonical full-EPC list arrives from the engineering team.
//
// Mock run simulates ~75% read rate on boxes 2 & 3 (master-list-verified),
// lower rate on remaining boxes (unresolved suffixes only) to show blind spots.

import type { ResolvedTagPlacement, RunMeta, RunTagRead } from './rfidTypes';

// ─── Placement database ───────────────────────────────────────────────────────
// Format: [boxNumber, face, position, label, fullEpc | null]
// prettier-ignore
const RAW_PLACEMENTS: [number, string, string, string, string | null][] = [
  // Box 1
  [1,'Front','TL','283A0A5',null],[1,'Front','TR','28452D4',null],[1,'Front','BL','283A055',null],[1,'Front','BR','283A674',null],
  [1,'Back','TL','28452C4',null],[1,'Back','TR','2845224',null],[1,'Back','BL','2844C84',null],[1,'Back','BR','2844C34',null],
  [1,'Left','TL','2847884',null],[1,'Left','TR','2835895',null],[1,'Left','BL','284C654',null],[1,'Left','BR','284C0B4',null],
  [1,'Right','TL','2844C24',null],[1,'Right','TR','2845234',null],[1,'Right','BL','28452E5',null],[1,'Right','BR','27C8006',null],
  [1,'Top','TL','283A045',null],[1,'Top','TR','283A074',null],[1,'Top','BL','284C6A5',null],[1,'Top','BR','284C0F5',null],
  [1,'Bottom','TL','27C8066',null],[1,'Bottom','TR','283A6C5',null],[1,'Bottom','BL','2847875',null],[1,'Bottom','BR','284C085',null],
  // Box 2 — master-list verified
  [2,'Front','TL','5C289B8','E28011B0A5020066E5C289B8'],[2,'Front','TR','5C10388','E28011B0A5020066E5C10388'],[2,'Front','BL','5C16FB8','E28011B0A5020066E5C16FB8'],[2,'Front','BR','5C16FE8','E28011B0A5020066E5C16FE8'],
  [2,'Back','TL','00B24C6','E2801191A5040076300B24C6'],[2,'Back','TR','5C25B38','E28011B0A5020066E5C25B38'],[2,'Back','BL','00B2496','E2801191A5040076300B2496'],[2,'Back','BR','5C1F5F8','E28011B0A5020066E5C1F5F8'],
  [2,'Left','TL','00A4E36','E2801191A5040076300A4E36'],[2,'Left','TR','00A4E46','E2801191A5040076300A4E46'],[2,'Left','BL','5C1F538','E28011B0A5020066E5C1F538'],[2,'Left','BR','00A4E06','E2801191A5040076300A4E06'],
  [2,'Right','TL','5C1F5B8','E28011B0A5020066E5C1F5B8'],[2,'Right','TR','5C1F588','E28011B0A5020066E5C1F588'],[2,'Right','BL','5C1F568','E28011B0A5020066E5C1F568'],[2,'Right','BR','5C1F528','E28011B0A5020066E5C1F528'],
  [2,'Top','TL','5C1F5C8','E28011B0A5020066E5C1F5C8'],[2,'Top','TR','5C16FA8','E28011B0A5020066E5C16FA8'],[2,'Top','BL','5C25B08','E28011B0A5020066E5C25B08'],[2,'Top','BR','00B24D6','E2801191A5040076300B24D6'],
  [2,'Bottom','TL','00AB336','E2801191A5040076300AB336'],[2,'Bottom','TR','00A09F6','E2801191A5040076300A09F6'],[2,'Bottom','BL','5C28938','E28011B0A5020066E5C28938'],[2,'Bottom','BR','5C16FF8','E28011B0A5020066E5C16FF8'],
  // Box 3 — master-list verified
  [3,'Front','TL','5C25B98','E28011B0A5020066E5C25B98'],[3,'Front','TR','5C16F68','E28011B0A5020066E5C16F68'],[3,'Front','BL','5C12948','E28011B0A5020066E5C12948'],[3,'Front','BR','5C12988','E28011B0A5020066E5C12988'],
  [3,'Back','TL','5C28928','E28011B0A5020066E5C28928'],[3,'Back','TR','00A09B6','E2801191A5040076300A09B6'],[3,'Back','BL','00A0986','E2801191A5040076300A0986'],[3,'Back','BR','00A09C6','E2801191A5040076300A09C6'],
  [3,'Left','TL','5C26318','E28011B0A5020066E5C26318'],[3,'Left','TR','5C10368','E28011B0A5020066E5C10368'],[3,'Left','BL','5C26358','E28011B0A5020066E5C26358'],[3,'Left','BR','5C26328','E28011B0A5020066E5C26328'],
  [3,'Right','TL','5C10338','E28011B0A5020066E5C10338'],[3,'Right','TR','5C263A8','E28011B0A5020066E5C263A8'],[3,'Right','BL','5C263B8','E28011B0A5020066E5C263B8'],[3,'Right','BR','5C26368','E28011B0A5020066E5C26368'],
  [3,'Top','TL','00AB3B6','E2801191A5040076300AB3B6'],[3,'Top','TR','5C16F08','E28011B0A5020066E5C16F08'],[3,'Top','BL','5C25B48','E28011B0A5020066E5C25B48'],[3,'Top','BR','5C28968','E28011B0A5020066E5C28968'],
  [3,'Bottom','TL','5C25B88','E28011B0A5020066E5C25B88'],[3,'Bottom','TR','5C25BC8','E28011B0A5020066E5C25BC8'],[3,'Bottom','BL','5C28988','E28011B0A5020066E5C28988'],[3,'Bottom','BR','5C25BD8','E28011B0A5020066E5C25BD8'],
  // Box 4
  [4,'Front','TL','1BD341A',null],[4,'Front','TR','1BD34BA',null],[4,'Front','BL','1BD34AA',null],[4,'Front','BR','1BD348A',null],
  [4,'Back','TL','1BE0E1A',null],[4,'Back','TR','1BE0E8A',null],[4,'Back','BL','28478D5',null],[4,'Back','BR','284C095',null],
  [4,'Left','TL','1BDBA9A',null],[4,'Left','TR','1BDC20A',null],[4,'Left','BL','1BDE8AA',null],[4,'Left','BR','1BDC2AA',null],
  [4,'Right','TL','1BC883A',null],[4,'Right','TR','1BE0E9A',null],[4,'Right','BL','1BCAE9A',null],[4,'Right','BR','1BCAE2A',null],
  [4,'Top','TL','1BC62CA',null],[4,'Top','TR','1BC62DA',null],[4,'Top','BL','1BDE82A',null],[4,'Top','BR','1BDC28A',null],
  [4,'Bottom','TL','1BE94AA',null],[4,'Bottom','TR','1BE948A',null],[4,'Bottom','BL','1BE0EBA',null],[4,'Bottom','BR','1BE940A',null],
  // Box 5 — short labels, different tag batch
  [5,'Front','TL','6946',null],[5,'Front','TR','6916',null],[5,'Front','BL','AE56',null],[5,'Front','BR','B69C6',null],
  [5,'Back','TL','AB336',null],[5,'Back','TR','AB376',null],[5,'Back','BL','AB386',null],[5,'Back','BR','AB3C6',null],
  [5,'Left','TL','AE16',null],[5,'Left','TR','6996',null],[5,'Left','BL','6906',null],[5,'Left','BR','6986',null],
  [5,'Right','TL','6986',null],[5,'Right','TR','AE46',null],[5,'Right','BL','6956',null],[5,'Right','BR','AE06',null],
  [5,'Top','TL','AF806',null],[5,'Top','TR','AB3F6',null],[5,'Top','BL','F886',null],[5,'Top','BR','F846',null],
  [5,'Bottom','TL','F876',null],[5,'Bottom','TR','B2456',null],[5,'Bottom','BL','B2416',null],[5,'Bottom','BR','2486',null],
  // Box 6
  [6,'Front','TL','2845275',null],[6,'Front','TR','2844CD5',null],[6,'Front','BL','2844C85',null],[6,'Front','BR','283A6D5',null],
  [6,'Back','TL','B2446',null],
  [6,'Left','TL','283A684',null],[6,'Left','TR','284C0E5',null],[6,'Left','BL','284C695',null],[6,'Left','BR','283A014',null],
  [6,'Right','TL','28452D5',null],[6,'Right','TR','2835884',null],[6,'Right','BL','2847874',null],[6,'Right','BR','283A0B5',null],
  [6,'Top','TL','284C084',null],[6,'Top','TR','E28011B0A502006C02844C94',null],[6,'Top','BL','28478E4',null],[6,'Top','BR','284C0C4',null],
  [6,'Bottom','TL','284C664',null],[6,'Bottom','TR','28478D4',null],[6,'Bottom','BL','283A655',null],[6,'Bottom','BR','28478E5',null],
  // Box 7
  [7,'Front','TL','1326',null],[7,'Front','TR','1BDBA0A',null],[7,'Front','BL','1BDBAAA',null],[7,'Front','BR','1BD349A',null],
  [7,'Back','TL','2844C75',null],[7,'Back','TR','2847885',null],[7,'Back','BL','2845285',null],[7,'Back','BR','2844CE5',null],
  [7,'Left','TL','1BDBA8A',null],[7,'Left','TR','1BDC27A',null],[7,'Left','BL','1BDBA7A',null],[7,'Left','BR','1BDC29A',null],
  [7,'Right','TL','F836',null],[7,'Right','TR','F8B6',null],[7,'Right','BL','B2406',null],[7,'Right','BR','F8C6',null],
  [7,'Top','TL','1BC625A',null],[7,'Top','TR','1BCAEBA',null],[7,'Top','BL','1BC62BA',null],[7,'Top','BR','1BC88AA',null],
  [7,'Bottom','TL','1BCAECA',null],[7,'Bottom','TR','1BCAEAA',null],[7,'Bottom','BL','1BC88DA',null],[7,'Bottom','BR','1BC88BA',null],
  // Box 8 — partially verified
  [8,'Front','TL','5C16F18','E28011B0A5020066E5C16F18'],[8,'Front','TR','5C16F58','E28011B0A5020066E5C16F58'],[8,'Front','BL','5C12908',null],[8,'Front','BR','AB364',null],
  [8,'Back','TL','1BE0EAA',null],[8,'Back','TR','1BDE89A',null],[8,'Back','BL','1BDE8BA',null],[8,'Back','BR','1BC5A0A',null],
  [8,'Left','TL','1BBD4EA',null],[8,'Left','TR','1BC620A',null],[8,'Left','BL','1BC5ADA',null],[8,'Left','BR','1BC5A5A',null],
  [8,'Right','TL','5C263E8','E28011B0A5020066E5C263E8'],[8,'Right','TR','5C263F8','E28011B0A5020066E5C263F8'],[8,'Right','BL','5C103F8','E28011B0A5020066E5C103F8'],[8,'Right','BR','5C129C8','E28011B0A5020066E5C129C8'],
  [8,'Top','TL','5C12988',null],[8,'Top','TR','00A4E76','E2801191A5040076300A4E76'],[8,'Top','BL','5C129D8','E28011B0A5020066E5C129D8'],[8,'Top','BR','5C12938','E28011B0A5020066E5C12938'],
  [8,'Bottom','TL','1BC5ACA',null],[8,'Bottom','TR','1BC62EA',null],[8,'Bottom','BL','1BDE8CA',null],[8,'Bottom','BR','1BC5AEA',null],
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

// ─── Mock run ─────────────────────────────────────────────────────────────────
// Simulates a realistic read: good coverage on boxes 2 & 3, patchy elsewhere.

const MOCK_READ_EPCS = [
  // Box 2 — 18/24 read (75%)
  'E28011B0A5020066E5C289B8','E28011B0A5020066E5C10388','E28011B0A5020066E5C16FB8',
  'E2801191A5040076300B24C6','E28011B0A5020066E5C25B38','E28011B0A5020066E5C1F5F8',
  'E2801191A5040076300A4E36','E2801191A5040076300A4E46','E28011B0A5020066E5C1F538',
  'E28011B0A5020066E5C1F5B8','E28011B0A5020066E5C1F568','E28011B0A5020066E5C1F528',
  'E28011B0A5020066E5C1F5C8','E28011B0A5020066E5C16FA8','E28011B0A5020066E5C25B08',
  'E2801191A5040076300AB336','E28011B0A5020066E5C28938','E28011B0A5020066E5C16FF8',
  // Box 3 — 20/24 read (83%)
  'E28011B0A5020066E5C25B98','E28011B0A5020066E5C16F68','E28011B0A5020066E5C12948',
  'E28011B0A5020066E5C28928','E2801191A5040076300A09B6','E2801191A5040076300A0986',
  'E28011B0A5020066E5C26318','E28011B0A5020066E5C10368','E28011B0A5020066E5C26358',
  'E28011B0A5020066E5C10338','E28011B0A5020066E5C263A8','E28011B0A5020066E5C26368',
  'E2801191A5040076300AB3B6','E28011B0A5020066E5C16F08','E28011B0A5020066E5C25B48',
  'E28011B0A5020066E5C25B88','E28011B0A5020066E5C25BC8','E28011B0A5020066E5C28988',
  'E28011B0A5020066E5C25BD8','E28011B0A5020066E5C28928',
  // Box 8 partial (verified tags only)
  'E28011B0A5020066E5C16F18','E28011B0A5020066E5C263E8','E28011B0A5020066E5C263F8',
  'E28011B0A5020066E5C129C8','E2801191A5040076300A4E76',
];

export const TEST_RUN_META: RunMeta = {
  name: 'Mock Run — Demo',
  antennaType: 'Directional 9dBi',
  angle: '45°',
  distance: '6 ft',
  timeout: '5s',
};

export const TEST_RUN_READS: RunTagRead[] = MOCK_READ_EPCS.map((epc) => ({
  rawEpc: epc,
  suffix: epc.slice(-7).toUpperCase(),
}));

/** Minimal CSV text that represents the mock run — used for download/copy. */
export const TEST_RUN_CSV = `EPC\n${MOCK_READ_EPCS.join('\n')}\n`;
