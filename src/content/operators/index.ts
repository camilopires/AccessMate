import { OperatorEntry } from '../schemas';
import avantiWestCoast from './avanti-west-coast.json';

const sources = [avantiWestCoast];

export function loadBundledOperators(): OperatorEntry[] {
  return sources.map((s) => OperatorEntry.parse(s));
}
