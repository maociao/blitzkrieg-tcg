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
    playerBoard: playerBoard.map((u, i) => serializeUnit(u, i)),
    turnCount: gameState.turnCount || 1
  };

  // 2. Construct Prompt
  const prompt = `
    You are an expert AI playing a strategy card game (WW2 theme).
    Your goal is to defeat the opponent (reduce PlayerHP to 0).
    
    **Rules:**
    - Mana supply: Supply is fixed per round. Each round the supply increases by 1. Any buffs that increase supply do not carry over to the next round. 
    - Turn Count: It is currently turn ${stateSummary.turnCount}. Use this to gauge the pace of the game. Early game (turns 1-3) focus on building presence. Late game (turn 6+) focus on finishing.
    - Mana costs: Each card has a mana cost associated with it. You have ${stateSummary.aiMana} mana. You must have enough "aiMana" to cover the "cost" of playing a card.
    - Attack: Units with canAttack=true can ATTACK enemy units or the HQ (face).
    - Counter Attack: If a defending unit is not destroyed in an attack, the defending unit can counter attack the attacking unit. The same passive support effects apply to the counter attack as a normal attack.
    - Passive Support: Some units have passive abilities that provide some benefit to other units. These benefits apply for as long as the unit is deployed.
    - Tactics: Tactic cards (like Supply Truck, Air Strike) are one-time use effects that are discarded after play.
    - Sleeping Sickness: Cards cannot be used during the turn in which they are played. The only exception are Tactics cards which do not have "sleeping sickness" when played.
    - Hand Limit: Each player starts with 2 unique support cards and 6 combat cards. No new cards are received once hand runs out.
    - Winning: playerHP <= 0. Player surrenders.

    **Current State:**
    ${JSON.stringify(stateSummary, null, 2)}

    **Instructions:**
    - Analyze the board and hand.
    - Choose the BEST single move.
    - Prioritize defending your HQ and defeating the opponent's HQ. 
    - Use units wisely, anticipating the opponent's next move. Ignore enemy bunkers.
    - Valid Actions:
      1. "PLAY_CARD": { "cardId": "string", "index": number (hand index) }
      2. "ATTACK": { "attackerIndex": number, "targetIndex": number (-1 for HQ) }
      3. "SURRENDER": {}
      4. "END_TURN": {}
    
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
