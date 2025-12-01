export const calculateBuffedBoard = (board) => {
  if (!board) return [];

  // 1. Calculate Global Buffs first
  let globalAtk = 0;
  let globalDef = 0;

  board.forEach(u => {
    if (u.id === 'supp_supply') {
      globalAtk += 1;
    }
    if (u.id === 'supp_hq') {
      globalAtk += 1;
      globalDef += 1;
    }
  });

  return board.map((unit, index) => {
    let buffAtk = globalAtk;
    let buffDef = globalDef;

    // Check adjacent for Commanders (Patton/Rommel) - REMOVED per balance changes
    // if (index > 0) { ... }

    // FIX: Support units should never get an attack buff
    if (unit.type === 'support') {
      buffAtk = 0;
    }

    if (buffAtk === 0 && buffDef === 0) return unit;

    return {
      ...unit,
      atk: unit.atk + buffAtk,
      def: unit.def + buffDef,
      // Visual only: Boost currentHp to match the def boost so they don't look damaged
      // Real HP logic handles damage separately.
      currentHp: unit.currentHp + buffDef
    };
  });
};
