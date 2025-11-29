import { GoogleGenerativeAI } from "@google/generative-ai";
import { CARD_DATABASE } from "../data/cards";

// Initialize Gemini
// NOTE: In a real production app, never expose API keys on the client.
// Use a backend proxy (Cloud Functions) instead.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const getAiMove = async (gameState, aiHand, aiBoard, playerBoard) => {
  if (!API_KEY) {
    console.error("Gemini API Key missing!");
    return { action: 'END_TURN' };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // 1. Serialize Game State
  const serializeCard = (id) => {
      const c = CARD_DATABASE[id];
      if (!c) return { id, name: "Unknown" };
      return {
          id, 
          name: c.name, 
          cost: c.cost, 
          atk: c.atk, 
          def: c.def, 
          desc: c.desc, 
          type: c.type,
          activeAbility: c.activeAbility,
          supportEffect: c.supportEffect
      };
  };

  const serializeUnit = (u, i) => {
      const c = CARD_DATABASE[u.id] || {};
      const isSupport = c.type === 'support';
      return { 
          index: i, 
          id: u.id, 
          name: u.name, 
          atk: u.atk, 
          currentHp: u.currentHp, 
          maxHp: u.def,
          desc: c.desc, 
          canAttack: isSupport ? false : u.canAttack,
          isDepleted: isSupport ? (u.isAbilityUsed || !u.canAttack) : undefined, 
          activeAbility: c.activeAbility, 
          supportEffect: c.supportEffect,  
          isTaunt: u.id === 'supp_bunker'
      };
  };

  const stateSummary = {
    aiHP: gameState.guestHP,
    aiMana: gameState.guestMana,
    playerHP: gameState.hostHP,
    playerHandCount: gameState.hostHand ? gameState.hostHand.length : 0,
    lastAction: gameState.lastAction,
    aiHand: aiHand.map(id => serializeCard(id)),
    aiBoard: aiBoard.map((u, i) => serializeUnit(u, i)),
    playerBoard: playerBoard.map((u, i) => serializeUnit(u, i))
  };

  // 2. Construct Prompt
  const prompt = `
    You are an expert AI playing a strategy card game (WW2 theme).
    Your goal is to defeat the opponent (reduce PlayerHP to 0).
    
    **Rules:**
    - Mana: Costs are fixed. You have ${stateSummary.aiMana} mana. You must have enough "aiMana" to cover the "cost" of playing a card.
    - Attack: Units can attack enemy units or the HQ (face). Only units with canAttack=true are available for ATTACK.
    - Counter Attack: If a defending unit is not destroyed in an attack, the attacking units suffer counter attack damage equal to the defending unit's attack
    - Passive Support: Some units have passive abilities that provide some benefit to the player. These benefits apply for as long as the unit is deployed.
    - Active Support: Support units can USE_ABILITY to boost other units or provide some other benefit to the player. Support units marked isDepleted=true are not available for USE_ABILITY. Support units cannot target themselves or other support units.
    - Healing: Units cannot be healed above their maxHP
    - Sleeping Sickness: Cards cannot be used during the turn in which they are played. The only exception are Instant Action cards like "Air Raid" which do not have "sleeping sickness" when played.
    - Invulnerability: Some units are invulnerable and cannot be damaged by an attack. 
    - Hand Limit: ${gameState.mode === 'draw' 
        ? 'In Draw Mode, hand is refilled to 2 Support and 4 Combat cards at the end of the turn.' 
        : 'Each player starts with 2 unique support cards and 4 combat cards. Players do not receive any new cards once their hand runs out.'}
    - Winning: Enemy HP <= 0. Enemy surrenders.

    **Current State:**
    ${JSON.stringify(stateSummary, null, 2)}

    **Instructions:**
    - Analyze the board and hand.
    - Choose the BEST single move.
    - Prioritize defending your units, destroying the enemy's units, and defeating the opponent's HQ. 
    - Use units wisely, anticipating the opponent's next move. Ignore enemy bunkers.
    - Valid Actions:
      1. "PLAY_CARD": { "cardId": "string", "index": number (hand index) }
      2. "ATTACK": { "attackerIndex": number, "targetIndex": number (-1 for HQ) }
      3. "USE_ABILITY": { "unitIndex": number, "targetIndex": number (optional: required for Support units to target ally, omitted for Active Ability like Supply Truck) }
      4. "SURRENDER": {}
      5. "END_TURN": {}
    
    **Output Format:**
    Return ONLY raw JSON. No markdown. No explanation.
    Example: { "action": "ATTACK", "attackerIndex": 0, "targetIndex": -1 }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean markdown if present (Gemini sometimes adds ```json)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return { action: 'END_TURN' }; // Fallback
  }
};
