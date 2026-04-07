/**
 * romPatcherLoader.js
 * 
 * Wrapper to load the locally converted ESM version of rom-patcher.
 * This replaces the previous loader that attempted to fix global variable issues
 * with the original rom-patcher package.
 */

import RomPatcher, { BinFile } from './lib/rom-patcher/RomPatcher';

export { RomPatcher, BinFile };
export default RomPatcher;
