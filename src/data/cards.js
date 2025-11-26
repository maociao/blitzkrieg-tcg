export const CARD_DATABASE = {
  // --- Combat Units ---
  'inf_rifle': {
    id: 'inf_rifle', name: 'Rifle Squad', type: 'infantry', cost: 1, atk: 1, def: 2, rarity: 'common',
    desc: 'Basic infantry unit.',
    history: 'The backbone of any army, rifle squads in WWII were equipped with bolt-action or semi-automatic rifles like the M1 Garand or Kar98k. They relied on mobility and volume of fire. "The rifleman is the first man to feel the crunch of battle." - Infantry Journal, 1942',
    artPrompt: 'ww2 us infantry soldier running combat ink watercolor sketch'
  },
  'inf_sniper': {
    id: 'inf_sniper', name: 'Sniper Elite', type: 'infantry', cost: 2, atk: 3, def: 1, rarity: 'uncommon',
    desc: 'High damage, low defense.',
    history: 'Snipers played a crucial psychological role, targeting officers and radiomen. The Soviet Lyudmila Pavlichenko famously confirmed 309 kills. "The only thing I feel when I kill a Nazi is the recoil of my rifle." - Lyudmila Pavlichenko',
    artPrompt: 'ww2 sniper ghillie suit aiming rifle forest ink watercolor sketch'
  },
  'tank_sherman': {
    id: 'tank_sherman', name: 'M4 Sherman', type: 'tank', cost: 4, atk: 3, def: 4, rarity: 'common',
    desc: 'Reliable medium tank.',
    history: 'The M4 Sherman was the workhorse of the Western Allies. While outgunned by heavy German armor, its reliability, numbers, and logistics support won the war. Over 49,000 were produced. Crews nicknamed it the "Ronson" because it "lights up the first time, every time" – a grim reference to its tendency to catch fire.',
    artPrompt: 'ww2 sherman tank dusty road combat ink watercolor sketch'
  },
  'tank_panzer': {
    id: 'tank_panzer', name: 'Panzer IV', type: 'tank', cost: 4, atk: 4, def: 3, rarity: 'uncommon',
    desc: 'Balanced german armor.',
    history: 'The only German tank to remain in production throughout the entire war. It served as the backbone of the Panzer divisions. Originally designed as an infantry support tank, it was up-gunned to fight other tanks. "The engine is the weapon of the tank." - Heinz Guderian',
    artPrompt: 'ww2 german panzer tank desert camouflage ink watercolor sketch'
  },
  'tank_tiger': {
    id: 'tank_tiger', name: 'Tiger I', type: 'tank', cost: 6, atk: 6, def: 6, rarity: 'rare',
    desc: 'Heavy armor beast.',
    history: 'Feared by Allied crews, the Tiger I featured thick armor and a devastating 88mm gun. However, it was mechanically complex and prone to breakdowns. A single Tiger could hold off a dozen Shermans, but they were often defeated by fuel shortages and their own weight.',
    artPrompt: 'ww2 tiger tank heavy armor imposing ink watercolor sketch'
  },
  'air_spitfire': {
    id: 'air_spitfire', name: 'Spitfire', type: 'air', cost: 3, atk: 4, def: 2, rarity: 'common',
    desc: 'Fast interceptor.',
    history: 'The hero of the Battle of Britain. Its elliptical wings gave it superior agility, allowing it to outturn many adversaries. "Never in the field of human conflict was so much owed by so many to so few." - Winston Churchill',
    artPrompt: 'ww2 spitfire fighter plane flying clouds ink watercolor sketch'
  },
  'air_mustang': {
    id: 'air_mustang', name: 'P-51 Mustang', type: 'air', cost: 5, atk: 5, def: 3, rarity: 'rare',
    desc: 'Long range escort.',
    history: 'Fitted with the Merlin engine, the P-51 had the range to escort bombers deep into Germany, changing the course of the air war. "When I saw Mustangs over Berlin, I knew the jig was up." - Hermann Göring',
    artPrompt: 'ww2 p51 mustang silver fighter plane blue sky ink watercolor sketch'
  },
  'event_airstrike': {
    id: 'event_airstrike', name: 'Air Strike', type: 'tactic', cost: 3, atk: 0, def: 0, rarity: 'uncommon',
    desc: 'Deal 2 dmg to all enemy units.', effect: 'aoe_2',
    history: 'Close air support became a decisive factor in Blitzkrieg tactics. Stuka dive bombers and Typhoons wreaked havoc on ground columns. The sound of the Stuka\'s "Jericho Trumpet" siren alone was enough to break morale.',
    artPrompt: 'explosions ww2 battlefield airstrike bombs dropping ink watercolor sketch'
  },
  'legend_patton': {
    id: 'legend_patton', name: 'Gen. Patton', type: 'commander', cost: 7, atk: 5, def: 8, rarity: 'limited',
    desc: 'LIMITED EDITION. Legendary commander.',
    history: 'George S. Patton ("Old Blood and Guts") led the US Third Army across France at breakneck speed. Known for his aggressive philosophy: "A good plan violently executed now is better than a perfect plan executed next week."',
    artPrompt: 'ww2 general patton portrait uniform rugged ink watercolor sketch'
  },
  'legend_rommel': {
    id: 'legend_rommel', name: 'Desert Fox', type: 'commander', cost: 7, atk: 6, def: 7, rarity: 'limited',
    desc: 'LIMITED EDITION. Master tactician.',
    history: 'Erwin Rommel earned respect from both sides for his chivalry and tactical brilliance in the North African campaign. He was implicated in the plot against Hitler and forced to commit suicide. "Don\'t fight a battle if you don\'t gain anything by winning."',
    artPrompt: 'erwin rommel german ww2 general desert uniform portrait ink watercolor sketch'
  },

  // --- Support Cards (New) ---
  'supp_bunker': {
    id: 'supp_bunker', name: 'Concrete Bunker', type: 'support', cost: 3, atk: 0, def: 8, rarity: 'common',
    desc: 'Fortifies a unit (+3 Max HP & Heal).', supportEffect: {type: 'buff_def', val: 3},
    history: 'The Atlantic Wall was a system of coastal fortifications built by Nazi Germany, featuring thousands of concrete bunkers. Despite the concrete and steel, they were static targets for naval bombardment and aerial bombing.',
    artPrompt: 'ww2 concrete bunker defensive normandy ink watercolor sketch'
  },
  'supp_medic': {
    id: 'supp_medic', name: 'Field Hospital', type: 'support', cost: 2, atk: 0, def: 4, rarity: 'common',
    desc: 'Heals a unit (+4 HP up to Max).', supportEffect: {type: 'heal', val: 4},
    history: 'Field medics and hospitals saved countless lives. Penicillin was mass-produced for the first time, drastically reducing infection deaths. "The real heroes of the war are the men who carry the stretchers." - Combat Veteran',
    artPrompt: 'ww2 red cross medical tent field hospital ink watercolor sketch'
  },
  'supp_supply': {
    id: 'supp_supply', name: 'Supply Truck', type: 'support', cost: 2, atk: 0, def: 3, rarity: 'uncommon',
    desc: 'Resupplies ammo (+2 ATK).', supportEffect: {type: 'buff_atk', val: 2},
    history: 'The "Red Ball Express" was a massive truck convoy system that supplied Allied forces moving quickly through Europe after D-Day. At its peak, it operated 5,958 vehicles and carried about 12,500 tons of supplies a day.',
    artPrompt: 'ww2 army truck cargo supplies mud ink watercolor sketch'
  },
  'supp_radar': {
    id: 'supp_radar', name: 'Radar Station', type: 'support', cost: 4, atk: 0, def: 5, rarity: 'rare',
    desc: 'Precision targeting (+1 ATK).', supportEffect: {type: 'buff_atk', val: 1},
    history: 'RADAR (RAdio Detection And Ranging) gave the RAF a critical advantage in the Battle of Britain, allowing them to scramble fighters to intercept raids. It was a closely guarded secret that changed the nature of warfare.',
    artPrompt: 'ww2 radar antenna dish radio tower ink watercolor sketch'
  },
  'supp_hq': {
    id: 'supp_hq', name: 'Forward HQ', type: 'support', cost: 6, atk: 0, def: 10, rarity: 'limited',
    desc: 'Invulnerable. Commands (+1/+1).', supportEffect: {type: 'buff_all', val: 1}, invulnerable: true,
    history: 'Field headquarters coordinated vast movements of troops. Communications were key, often using encrypted Enigma machines or Navajo code talkers. "Amateurs talk strategy. Professionals talk logistics." - Gen. Omar Bradley',
    artPrompt: 'ww2 generals map table command tent strategy ink watercolor sketch'
  },
};

export const RARITY_COLORS = {
  common: 'border-gray-500 bg-gray-800',
  uncommon: 'border-green-500 bg-gray-800',
  rare: 'border-blue-500 bg-blue-900',
  limited: 'border-yellow-400 bg-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
};

export const getCardImageUrl = (cardId, artPrompt, type, customSeed = null) => {
  const prompt = artPrompt || `ww2 ${type} combat unit ink watercolor sketch`;
  const encodedPrompt = encodeURIComponent(prompt + " white background");
  const seed = customSeed || cardId;
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=600&nologo=true&seed=${seed}&model=flux`;
};
