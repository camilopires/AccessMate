import { OperatorEntry } from '../schemas';
import avantiWestCoast from './avanti-west-coast.json';
import c2c from './c2c.json';
import chilternRailways from './chiltern-railways.json';
import crosscountry from './crosscountry.json';
import eastMidlandsRailway from './east-midlands-railway.json';
import elizabethLine from './elizabeth-line.json';
import greatWesternRailway from './great-western-railway.json';
import greaterAnglia from './greater-anglia.json';
import lner from './lner.json';
import lumo from './lumo.json';
import merseyrail from './merseyrail.json';
import northern from './northern.json';
import scotrail from './scotrail.json';
import southWesternRailway from './south-western-railway.json';
import southeastern from './southeastern.json';
import southern from './southern.json';
import thameslink from './thameslink.json';
import transpennineExpress from './transpennine-express.json';
import transportForWales from './transport-for-wales.json';
import westMidlandsRailway from './west-midlands-railway.json';

// 20 of the largest UK rail operators by passenger volume. Addresses
// sourced from each operator's own published accessibility / customer-
// relations page on 2026-05-24; see docs/operators-verification.md.
const sources = [
  avantiWestCoast,
  c2c,
  chilternRailways,
  crosscountry,
  eastMidlandsRailway,
  elizabethLine,
  greatWesternRailway,
  greaterAnglia,
  lner,
  lumo,
  merseyrail,
  northern,
  scotrail,
  southWesternRailway,
  southeastern,
  southern,
  thameslink,
  transpennineExpress,
  transportForWales,
  westMidlandsRailway,
];

export function loadBundledOperators(): OperatorEntry[] {
  return sources.map((s) => OperatorEntry.parse(s));
}
