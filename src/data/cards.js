export const CARD_DATABASE = {
  // --- Combat Units ---
  'inf_rifle': { id: 'inf_rifle', name: 'Rifle Squad', type: 'infantry', cost: 1, atk: 1, def: 2, rarity: 'common', desc: 'Basic infantry unit.', artPrompt: 'ww2 us infantry soldier running combat ink watercolor sketch' },
  'inf_sniper': { id: 'inf_sniper', name: 'Sniper Elite', type: 'infantry', cost: 2, atk: 3, def: 1, rarity: 'uncommon', desc: 'High damage, low defense.', artPrompt: 'ww2 sniper ghillie suit aiming rifle forest ink watercolor sketch' },
  'tank_sherman': { id: 'tank_sherman', name: 'M4 Sherman', type: 'tank', cost: 4, atk: 3, def: 4, rarity: 'common', desc: 'Reliable medium tank.', artPrompt: 'ww2 sherman tank dusty road combat ink watercolor sketch' },
  'tank_panzer': { id: 'tank_panzer', name: 'Panzer IV', type: 'tank', cost: 4, atk: 4, def: 3, rarity: 'uncommon', desc: 'Balanced german armor.', artPrompt: 'ww2 german panzer tank desert camouflage ink watercolor sketch' },
  'tank_tiger': { id: 'tank_tiger', name: 'Tiger I', type: 'tank', cost: 6, atk: 6, def: 6, rarity: 'rare', desc: 'Heavy armor beast.', artPrompt: 'ww2 tiger tank heavy armor imposing ink watercolor sketch' },
  'air_spitfire': { id: 'air_spitfire', name: 'Spitfire', type: 'air', cost: 3, atk: 4, def: 2, rarity: 'common', desc: 'Fast interceptor.', artPrompt: 'ww2 spitfire fighter plane flying clouds ink watercolor sketch' },
  'air_mustang': { id: 'air_mustang', name: 'P-51 Mustang', type: 'air', cost: 5, atk: 5, def: 3, rarity: 'rare', desc: 'Long range escort.', artPrompt: 'ww2 p51 mustang silver fighter plane blue sky ink watercolor sketch' },
  'event_airstrike': { id: 'event_airstrike', name: 'Air Strike', type: 'tactic', cost: 3, atk: 0, def: 0, rarity: 'uncommon', desc: 'Deal 2 dmg to all enemy units.', effect: 'aoe_2', artPrompt: 'explosions battlefield airstrike bombs dropping ink watercolor sketch' },
  'legend_patton': { id: 'legend_patton', name: 'Gen. Patton', type: 'commander', cost: 7, atk: 5, def: 8, rarity: 'limited', desc: 'LIMITED EDITION. Legendary commander.', artPrompt: 'general patton portrait ww2 uniform rugged ink watercolor sketch' },
  'legend_rommel': { id: 'legend_rommel', name: 'Desert Fox', type: 'commander', cost: 7, atk: 6, def: 7, rarity: 'limited', desc: 'LIMITED EDITION. Master tactician.', artPrompt: 'erwin rommel german general desert uniform portrait ink watercolor sketch' },
  
  // --- Support Cards (New) ---
  'supp_bunker': { id: 'supp_bunker', name: 'Concrete Bunker', type: 'support', cost: 3, atk: 0, def: 8, rarity: 'common', desc: 'Fortifies a unit (+3 Max HP & Heal).', supportEffect: {type: 'buff_def', val: 3}, artPrompt: 'ww2 concrete bunker defensive normandy ink watercolor sketch' },
  'supp_medic': { id: 'supp_medic', name: 'Field Hospital', type: 'support', cost: 2, atk: 0, def: 4, rarity: 'common', desc: 'Heals a unit (+4 HP up to Max).', supportEffect: {type: 'heal', val: 4}, artPrompt: 'ww2 red cross medical tent field hospital ink watercolor sketch' },
  'supp_supply': { id: 'supp_supply', name: 'Supply Truck', type: 'support', cost: 2, atk: 0, def: 3, rarity: 'uncommon', desc: 'Resupplies ammo (+2 ATK).', supportEffect: {type: 'buff_atk', val: 2}, artPrompt: 'ww2 army truck cargo supplies mud ink watercolor sketch' },
  'supp_radar': { id: 'supp_radar', name: 'Radar Station', type: 'support', cost: 4, atk: 0, def: 5, rarity: 'rare', desc: 'Precision targeting (+1 ATK).', supportEffect: {type: 'buff_atk', val: 1}, artPrompt: 'ww2 radar antenna dish radio tower ink watercolor sketch' },
  'supp_hq': { id: 'supp_hq', name: 'Forward HQ', type: 'support', cost: 6, atk: 0, def: 10, rarity: 'limited', desc: 'Invulnerable. Commands (+1/+1).', supportEffect: {type: 'buff_all', val: 1}, invulnerable: true, artPrompt: 'ww2 generals map table command tent strategy ink watercolor sketch' },
};

export const RARITY_COLORS = {
  common: 'border-gray-500 bg-gray-800',
  uncommon: 'border-green-500 bg-gray-800',
  rare: 'border-blue-500 bg-blue-900',
  limited: 'border-yellow-400 bg-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
};

export const getCardImageUrl = (cardId, artPrompt, type) => {
  const prompt = artPrompt || `ww2 ${type} combat unit ink watercolor sketch`;
  const encodedPrompt = encodeURIComponent(prompt + " white background");
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=600&nologo=true&seed=${cardId}`;
};
