import React, { useState, useEffect, useRef } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  increment,
  query,
  where
} from 'firebase/firestore';
import { 
  Shield, 
  Wifi, 
  WifiOff, 
  User 
} from 'lucide-react';

import { auth, db, appId } from './firebase';
import { CARD_DATABASE } from './data/cards';

// Components
import Card from './components/Card';
import Modal from './components/Modal';

// Views
import RenderHome from './views/RenderHome';
import RenderCollection from './views/RenderCollection';
import RenderMarket from './views/RenderMarket';
import RenderLobby from './views/RenderLobby';
import GameView from './views/GameView';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [matchesList, setMatchesList] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  const [selectedUnitId, setSelectedUnitId] = useState(null); 
  const [visualEffects, setVisualEffects] = useState({}); 
  const prevEffectsRef = useRef(""); 
  
  const [hqDamage, setHqDamage] = useState(null); 
  const prevMyHp = useRef(null);
  
  const [splashCard, setSplashCard] = useState(null);
  const prevLastAction = useRef("");
  
  // Zoom / Inspect Card State
  const [inspectCard, setInspectCard] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const [gameState, setGameState] = useState(null);

  // --- Authentication & Init ---
  useEffect(() => {
    const initAuth = async () => {
      // Check for global token if injected (legacy support) or just sign in anonymously
      if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- User Data Sync & Test Mode ---
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    const unsub = onSnapshot(userRef, async (docSnap) => {
      setConnectionError(null); 
      
      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('test') === 'true';
      
      const starterDeck = [
        'inf_rifle', 'inf_rifle', 'inf_rifle', 
        'inf_sniper', 'tank_sherman', 'air_spitfire',
        'supp_bunker', 'supp_medic' 
      ];

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // URL Test Mode (Runs on every sync if flag persists)
        if (isTestMode) {
            const allCards = Object.keys(CARD_DATABASE);
            if (data.collection.length < allCards.length) {
                 await updateDoc(userRef, { collection: allCards, credits: 1000 });
                 showNotif("TEST MODE ACTIVATED: Collection Unlocked!");
            }
        } else {
             // Normal Supply Drop
             const hasSupportCards = data.collection.some(id => CARD_DATABASE[id] && CARD_DATABASE[id].type === 'support');
             if (!hasSupportCards) {
               const supportPackage = ['supp_bunker', 'supp_medic', 'supp_supply', 'supp_radar'];
               const newCollection = [...data.collection, ...supportPackage];
               await updateDoc(userRef, { collection: newCollection });
               showNotif("HQ Airdropped Support Units!");
             }
        }
      } else {
        // NEW USER
        const initialData = {
            credits: 100,
            collection: starterDeck,
            wins: 0,
            losses: 0,
            username: `Commander-${user.uid.substring(0, 5)}`
        };
        
        if (isTestMode) {
           initialData.collection = Object.keys(CARD_DATABASE);
           initialData.credits = 1000;
           setTimeout(() => showNotif("TEST MODE: Account Created with Full Collection!"), 1000);
        }

        setDoc(userRef, initialData).catch(err => {
          console.error("Init error", err);
          setConnectionError("DB Init Failed: Permission Denied?");
        });
      }

    }, (err) => {
      console.error("Auth sync error", err);
      setConnectionError("Connection Error: Multiplayer sync failed. You may need to refresh.");
    });
    return () => unsub();
  }, [user]);

  // Manual Test Mode Trigger
  const activateTestMode = async () => {
     if (!user || !userData) return;
     const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
     const allCards = Object.keys(CARD_DATABASE);
     try {
         await updateDoc(userRef, { collection: allCards, credits: userData.credits + 1000 });
         showNotif("TEST MODE ACTIVATED: Cards Unlocked + 1000 Credits!");
     } catch (e) {
         console.error(e);
         showNotif("Error activating test mode.");
     }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'transfers'),
      where('to', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        // Double check not needed due to query, but good for safety
        if (data.to === user.uid) {
          try {
            await deleteDoc(d.ref);
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
            await updateDoc(userRef, { credits: increment(data.amount) });
            showNotif(`Received ${data.amount} credits from a sale!`);
          } catch (e) {
            console.error("Error processing transfer", e);
          }
        }
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (view !== 'market' || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'market');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ ...doc.data(), id: doc.id }));
      setMarketListings(items);
    }, (err) => console.error("Market sync error", err));
    return () => unsub();
  }, [view, user]);

  const listCardForSale = async (cardId, price) => {
    if (!user || !price) return;
    try {
      const newCollection = [...userData.collection];
      const idx = newCollection.indexOf(cardId);
      if (idx === -1) return;
      newCollection.splice(idx, 1);
      
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      await updateDoc(userRef, { collection: newCollection });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'market'), {
        sellerId: user.uid,
        cardId,
        price: parseInt(price),
        sellerName: userData.username,
        createdAt: serverTimestamp()
      });
      showNotif("Card listed on market!");
    } catch (e) {
      console.error("List error", e);
      showNotif("Error listing card");
    }
  };

  const buyCard = async (listing) => {
    if (userData.credits < listing.price) {
      showNotif("Insufficient credits!");
      return;
    }
    if (listing.sellerId === user.uid) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'market', listing.id));
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      const newCollection = [...userData.collection, listing.cardId];
      await updateDoc(userRef, { collection: newCollection });
      showNotif("Listing cancelled, card returned.");
      return;
    }

    try {
      setLoading(true);
      const buyerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
      const buyerSnap = await getDoc(buyerRef);
      const buyerData = buyerSnap.data();
      
      if (buyerData.credits < listing.price) throw new Error("Funds too low");

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'market', listing.id));

      await updateDoc(buyerRef, {
        credits: increment(-listing.price),
        collection: [...buyerData.collection, listing.cardId]
      });

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transfers'), {
          to: listing.sellerId,
          amount: listing.price,
          from: user.uid,
          listingId: listing.id,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Error creating transfer record", err);
      }

      showNotif(`Bought ${CARD_DATABASE[listing.cardId].name}!`);
    } catch (e) {
      console.error(e);
      showNotif("Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'lobby' || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const unsub = onSnapshot(q, (snapshot) => {
      const m = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.status === 'waiting') m.push({ id: doc.id, ...d });
      });
      setMatchesList(m);
    });
    return () => unsub();
  }, [view, user]);

  const createMatch = async () => {
    setLoading(true);
    try {
      const matchRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        hostId: user.uid,
        hostName: userData.username,
        status: 'waiting',
        createdAt: serverTimestamp(),
        hostBoard: [],
        guestBoard: [],
        hostHand: [],
        guestHand: [],
        lastEffects: [] 
      });
      joinMatch(matchRef.id, true);
    } catch (e) {
      console.error(e);
    }
  };

  const joinMatch = (matchId, isHost = false) => {
    setActiveMatch({ id: matchId, isHost });
    setRewardClaimed(false); 
    setView('game');
  };

  const grantWinReward = async () => {
    if (!userData || !user) return;
    const keys = Object.keys(CARD_DATABASE);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    const roll = Math.random();
    let rewardCard = randomKey;
    if (roll < 0.05) rewardCard = 'legend_patton'; 
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    await updateDoc(userRef, {
      credits: increment(50),
      wins: increment(1),
      collection: [...userData.collection, rewardCard]
    });
    showNotif(`VICTORY! Earned 50cr & ${CARD_DATABASE[rewardCard].name}`);
  };

  // --- Game Logic ---
  const joiningRef = useRef(false);

  useEffect(() => {
    if (view !== 'game' || !activeMatch) return;
    
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    
    const unsub = onSnapshot(matchRef, async (snap) => {
      if (!snap.exists()) {
        handleLeaveClean();
        showNotif("Match ended or invalid.");
        return;
      }
      const data = snap.data();
      
      if (!activeMatch.isHost && data.status === 'waiting') {
         if (!data.guestId && !joiningRef.current) {
            joiningRef.current = true; // Prevent loop
            try {
              await updateDoc(matchRef, {
                guestId: user.uid,
                guestName: userData.username,
                status: 'active',
                turn: 'host', 
                hostHP: 20,
                guestHP: 20,
                hostMana: 1,
                guestMana: 1,
                maxMana: 1,
                hostBoard: [], 
                guestBoard: [],
                hostHand: [],
                guestHand: [],
                lastEffects: [],
                lastAction: 'Game Start'
              });
            } catch (e) {
              console.error("Join error:", e);
              joiningRef.current = false; // Reset on error
            }
         } else if (data.guestId && data.guestId !== user.uid) {
            showNotif("Match is full!");
            handleLeaveClean();
         }
      } else {
        setGameState(data);
      }
    });
    return () => unsub();
  }, [view, activeMatch]);

  useEffect(() => {
    if (!gameState || !userData || gameState.status !== 'active') return;
    
    const isHost = activeMatch.isHost;
    const myHandKey = isHost ? 'hostHand' : 'guestHand';
    
    if (!gameState[myHandKey] || gameState[myHandKey].length === 0) {
      const fullCollection = [...userData.collection];
      const combatCards = [];
      const supportCards = [];

      fullCollection.forEach(id => {
        const card = CARD_DATABASE[id];
        if (card) {
          if (card.type === 'support') supportCards.push(id);
          else combatCards.push(id);
        }
      });

      combatCards.sort(() => 0.5 - Math.random());
      supportCards.sort(() => 0.5 - Math.random());

      let hand = [];
      const supportsNeeded = 2;
      const combatNeeded = 4;

      hand = [...hand, ...supportCards.slice(0, supportsNeeded)];
      hand = [...hand, ...combatCards.slice(0, combatNeeded)];
      
      if (hand.length < 6) {
         const remaining = fullCollection.filter(c => !hand.includes(c)).sort(() => 0.5 - Math.random());
         hand = [...hand, ...remaining.slice(0, 6 - hand.length)];
      }

      const update = {};
      update[myHandKey] = hand;
      
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
      updateDoc(matchRef, update);
    }
  }, [gameState && gameState.status]);

  // --- VISUAL EFFECTS ENGINE ---
  useEffect(() => {
    if (gameState && gameState.lastEffects) {
      const effectsStr = JSON.stringify(gameState.lastEffects);
      if (effectsStr !== prevEffectsRef.current) {
        // New effects detected!
        const newEffects = {};
        gameState.lastEffects.forEach(fx => {
          newEffects[fx.unitId] = { type: fx.type, id: fx.id || Date.now() }; // Add random ID for re-render
        });
        
        setVisualEffects(newEffects);
        
        // Clear effects after 1.5s
        setTimeout(() => {
          setVisualEffects({});
        }, 1500);

        prevEffectsRef.current = effectsStr;
      }
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState && gameState.status === 'finished' && gameState.winner === user?.uid && !rewardClaimed) {
      setRewardClaimed(true);
      grantWinReward();
    }
  }, [gameState, user, rewardClaimed]);

  // --- HQ Damage Calculation (LIFTED) ---
  const myHp = gameState ? (activeMatch?.isHost ? gameState.hostHP : gameState.guestHP) : null;
  const enemyHp = gameState ? (activeMatch?.isHost ? gameState.guestHP : gameState.hostHP) : 0;
  const isMyTurn = gameState ? gameState.turn === (activeMatch?.isHost ? 'host' : 'guest') : false;
  const myBoard = gameState ? (activeMatch?.isHost ? gameState.hostBoard : gameState.guestBoard) || [] : [];
  const enemyBoard = gameState ? (activeMatch?.isHost ? gameState.guestBoard : gameState.hostBoard) || [] : [];
  const myHand = gameState ? (activeMatch?.isHost ? gameState.hostHand : gameState.guestHand) || [] : [];
  const myMana = gameState ? (activeMatch?.isHost ? gameState.hostMana : gameState.guestMana) : 0;

  useEffect(() => {
    if (myHp === null) return;
    if (prevMyHp.current === null) {
        prevMyHp.current = myHp;
        return;
    }
    if (myHp < prevMyHp.current) {
        const diff = prevMyHp.current - myHp;
        setHqDamage({ amount: diff, id: Date.now() });
        setTimeout(() => setHqDamage(null), 2000);
    }
    prevMyHp.current = myHp;
  }, [myHp]);

  // --- CARD SPLASH EFFECT ---
  useEffect(() => {
    if (gameState && gameState.lastAction) {
      if (prevLastAction.current !== gameState.lastAction) {
        // Find if action mentions a tactic card
        const tactic = Object.values(CARD_DATABASE).find(c => 
          c.type === 'tactic' && gameState.lastAction.includes(c.name)
        );
        if (tactic) {
          setSplashCard(tactic);
          setTimeout(() => setSplashCard(null), 6000);
        }
        prevLastAction.current = gameState.lastAction;
      }
    }
  }, [gameState]);

  const handleEndTurn = async () => {
    if (isProcessing) return;
    if (!gameState) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;

    setIsProcessing(true);
    setSelectedUnitId(null);
    const nextTurn = isHost ? 'guest' : 'host';
    const nextMaxMana = Math.min(gameState.maxMana + (isHost ? 0 : 1), 10);
    const nextPlayerBoardKey = isHost ? 'guestBoard' : 'hostBoard';
    const nextPlayerBoard = [...gameState[nextPlayerBoardKey]].map(u => ({
      ...u,
      canAttack: true
    }));
    const update = {
      turn: nextTurn,
      maxMana: nextMaxMana,
      hostMana: nextMaxMana,
      guestMana: nextMaxMana,
      [nextPlayerBoardKey]: nextPlayerBoard, 
      lastAction: `Turn pass to ${nextTurn}`,
      lastEffects: [] 
    };
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    await updateDoc(matchRef, update);
    setTimeout(() => setIsProcessing(false), 1200); 
  };

  const handlePlayCard = async (cardId, index) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    const myTurn = isHost ? 'host' : 'guest';
    if (gameState.turn !== myTurn) { showNotif("Not your turn!"); return; }
    
    const manaKey = isHost ? 'hostMana' : 'guestMana';
    const handKey = isHost ? 'hostHand' : 'guestHand';
    const boardKey = isHost ? 'hostBoard' : 'guestBoard';
    
    const cardData = CARD_DATABASE[cardId];
    if (gameState[manaKey] < cardData.cost) { showNotif("Not enough supplies!"); return; }

    setIsProcessing(true);
    const lockTime = cardData.type === 'tactic' ? 6000 : 1200;

    const newHand = [...gameState[handKey]];
    newHand.splice(index, 1);
    
    const newBoard = [...gameState[boardKey]];
    
    const unitId = `${cardId}_${Date.now()}`;
    const unit = {
      ...cardData,
      instanceId: unitId,
      currentHp: cardData.def,
      canAttack: false,
      isAbilityUsed: false
    };
    
    if (cardData.type === 'tactic') {
      if (cardData.effect === 'aoe_2') {
        const enemyBoardKey = isHost ? 'guestBoard' : 'hostBoard';
        // Calc damage
        const enemyBoard = [...gameState[enemyBoardKey]];
        const fxList = [];
        const uniqueFxId = Date.now();
        
        const updatedEnemyBoard = enemyBoard.map(u => {
          fxList.push({ unitId: u.instanceId, type: 'damage', id: uniqueFxId + Math.random() }); // Queue visual effect
          return { ...u, currentHp: u.currentHp - 2 };
        });

        // NOTE: We KEEP dead units (HP<=0) for animation purposes, cleaned up in delayed step.
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
        await updateDoc(matchRef, {
           [enemyBoardKey]: updatedEnemyBoard,
           [handKey]: newHand,
           [manaKey]: gameState[manaKey] - cardData.cost,
           lastAction: `${isHost?'Host':'Guest'} launched Air Strike!`,
           lastEffects: fxList // Trigger explosions on ALL targets
        });
        
        // Delayed Cleanup for Tactic
        setTimeout(async () => {
             const finalCleanEnemy = updatedEnemyBoard.filter(u => u.currentHp > 0);
             if (finalCleanEnemy.length !== updatedEnemyBoard.length) {
               await updateDoc(matchRef, { [enemyBoardKey]: finalCleanEnemy });
             }
             setIsProcessing(false);
        }, 2500); // Longer wait for tactics
        return;
      }
    } else {
      newBoard.push(unit);
    }

    const update = {
      [handKey]: newHand,
      [boardKey]: newBoard,
      [manaKey]: gameState[manaKey] - cardData.cost,
      lastAction: `${isHost?'Host':'Guest'} deployed ${cardData.name}`,
      lastEffects: []
    };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);
    setTimeout(() => setIsProcessing(false), lockTime);
  };

  const handleSupportAction = async (supportUnit, targetUnit, targetIndex) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) {
        showNotif("Not your turn!");
        return;
    }
    if (supportUnit.isAbilityUsed) {
      showNotif("Support ability already used!");
      return;
    }
    if (supportUnit.canAttack === false) {
      showNotif("Support unit is busy!");
      return;
    }
    if (targetUnit.type === 'support') {
      showNotif("Cannot support another Support unit!");
      return;
    }

    setIsProcessing(true);

    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const myBoard = [...gameState[myBoardKey]];

    // Apply Effect
    const effect = supportUnit.supportEffect;
    let fxType = 'heal'; // Default

    if (effect) {
      const target = myBoard[targetIndex];
      if (effect.type === 'heal') {
         const maxHp = target.def;
         target.currentHp = Math.min(target.currentHp + effect.val, maxHp);
         fxType = 'heal';
      }
      if (effect.type === 'buff_def') { 
         target.def += effect.val; 
         target.currentHp += effect.val; 
         fxType = 'buff_def';
      } 
      if (effect.type === 'buff_atk') {
        target.atk += effect.val;
        fxType = 'buff_atk';
      }
      if (effect.type === 'buff_all') { 
         target.atk += effect.val; 
         target.def += effect.val; 
         target.currentHp += effect.val;
         fxType = 'buff_def'; // Combined visual
      }
    }

    const supporterIdx = myBoard.findIndex(u => u.instanceId === supportUnit.instanceId);
    if (supporterIdx !== -1) {
      myBoard[supporterIdx].canAttack = false;
      myBoard[supporterIdx].isAbilityUsed = true; 
    }

    const uniqueFxId = Date.now();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), {
      [myBoardKey]: myBoard,
      lastAction: `${supportUnit.name} supported ${targetUnit.name}`,
      lastEffects: [
        { unitId: targetUnit.instanceId, type: fxType, id: uniqueFxId },
        { unitId: supportUnit.instanceId, type: 'action_buff', id: uniqueFxId + 1 }
      ] 
    });
    
    setSelectedUnitId(null); 
    setTimeout(() => setIsProcessing(false), 1200); 
  };

  const handleAttack = async (targetIndex = -1) => {
    if (isProcessing) return;
    const isHost = activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;
    
    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const enemyBoardKey = isHost ? 'guestBoard' : 'hostBoard';
    const enemyHpKey = isHost ? 'guestHP' : 'hostHP';

    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    
    const myBoard = [...gameState[myBoardKey]];
    let attacker;

    if (selectedUnitId) {
      attacker = myBoard.find(u => u.instanceId === selectedUnitId);
    } else {
      attacker = myBoard.find(u => u.canAttack && u.type !== 'support');
    }

    if (!attacker) {
      showNotif("No ready combat units available!");
      return;
    }
    if (attacker.type === 'support') {
      showNotif("Support units cannot attack!");
      return;
    }
    if (attacker.canAttack === false) {
      showNotif("Unit is recovering (Zzz)!");
      return;
    }

    setIsProcessing(true);

    const myUnitIndex = myBoard.findIndex(u => u.instanceId === attacker.instanceId);
    if (myUnitIndex !== -1) {
      myBoard[myUnitIndex].canAttack = false;
    }

    let update = { [myBoardKey]: myBoard };
    const fxList = []; 
    const uniqueFxId = Date.now();

    fxList.push({ unitId: attacker.instanceId, type: 'action_attack', id: uniqueFxId });

    if (targetIndex === -1) {
      const newEnemyHp = gameState[enemyHpKey] - attacker.atk;
      update[enemyHpKey] = newEnemyHp;
      update.lastAction = `${attacker.name} attacked Command Post!`;
      update.lastEffects = fxList; // Attacker effect only

      if (newEnemyHp <= 0) {
        update.status = 'finished';
        update.winner = user.uid;
      }
    } else {
      const enemyBoard = [...gameState[enemyBoardKey]];
      const target = enemyBoard[targetIndex];
      
      if (target.invulnerable) {
        showNotif("Target is INVULNERABLE!");
        fxList.push({ unitId: target.instanceId, type: 'buff_def', id: uniqueFxId + 1 }); 
        await updateDoc(matchRef, { ...update, lastEffects: fxList });
        setSelectedUnitId(null);
        setTimeout(() => setIsProcessing(false), 1200);
        return;
      }

      target.currentHp -= attacker.atk;
      fxList.push({ unitId: target.instanceId, type: 'damage', id: uniqueFxId + 2 }); 
      
      if (target.currentHp > 0) {
        // Recoil only if target survived
        if (myUnitIndex !== -1) {
           myBoard[myUnitIndex].currentHp -= target.atk;
           // FIX 1: Show recoil damage ONLY if enemy had attack power
           if (target.atk > 0) {
              fxList.push({ unitId: attacker.instanceId, type: 'damage', id: uniqueFxId + 3 });
           }
        }
      }

      // FIX 2: DELAYED DEATH - Keep units in array for animation
      update[enemyBoardKey] = enemyBoard;
      update[myBoardKey] = myBoard; 
      
      update.lastAction = `${attacker.name} engaged ${target.name}`;
      update.lastEffects = fxList;
    }

    await updateDoc(matchRef, update);
    setSelectedUnitId(null); 

    // Delayed Cleanup Step
    if (targetIndex !== -1) {
       setTimeout(async () => {
          const cleanEnemy = update[enemyBoardKey].filter(u => u.currentHp > 0);
          const cleanMy = update[myBoardKey].filter(u => u.currentHp > 0);

          if (cleanEnemy.length !== update[enemyBoardKey].length || cleanMy.length !== update[myBoardKey].length) {
             await updateDoc(matchRef, {
               [enemyBoardKey]: cleanEnemy,
               [myBoardKey]: cleanMy
             });
          }
       }, 1000);
    }
    setTimeout(() => setIsProcessing(false), 1200); 
  };

  const handleBoardClick = (unit, index, isEnemy) => {
    if (isEnemy) {
      handleAttack(index);
      return;
    }

    if (selectedUnitId) {
      const isHost = activeMatch.isHost;
      const myBoard = isHost ? gameState.hostBoard : gameState.guestBoard;
      const selectedUnit = myBoard.find(u => u.instanceId === selectedUnitId);

      if (selectedUnitId === unit.instanceId) {
        setSelectedUnitId(null);
        return;
      }

      if (selectedUnit && selectedUnit.type === 'support') {
        handleSupportAction(selectedUnit, unit, index);
        return;
      }
      
      if (unit.type === 'support' && unit.isAbilityUsed) {
         showNotif("This unit is depleted.");
         return; 
      }
      setSelectedUnitId(unit.instanceId);
    } else {
      if (unit.type === 'support' && unit.isAbilityUsed) {
         showNotif("This unit is depleted.");
         return; 
      }
      setSelectedUnitId(unit.instanceId);
    }
  };

  const handleSurrender = async () => {
    if (!activeMatch || !gameState) return;
    const isHost = activeMatch.isHost;
    
    const update = {
      status: 'finished',
      winner: isHost ? gameState.guestId : gameState.hostId, 
      lastAction: `${isHost ? 'Host' : 'Guest'} surrendered!`
    };
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);
  };

  const handleLeaveClean = () => {
    setActiveMatch(null);
    setGameState(null);
    setView('home');
  };

  const handleCancelMatch = async () => {
    if (!activeMatch) return;
    try {
      if (activeMatch.isHost && gameState && gameState.status === 'waiting') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id));
        showNotif("Operation cancelled.");
      }
    } catch (e) {
      console.error("Error deleting match", e);
    }
    handleLeaveClean();
  };

  return (
    <div className="w-full h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="h-14 bg-black flex items-center justify-between px-6 border-b border-gray-800 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-yellow-600 font-black tracking-widest uppercase">
            <Shield className="mr-2" /> Blitzkrieg
          </div>
          
          {connectionError ? (
             <div className="flex items-center text-red-500 text-xs font-bold animate-pulse" title={connectionError}>
               <WifiOff size={14} className="mr-1" /> Offline/Error
             </div>
          ) : (
             <div className="flex flex-col justify-center">
               <div className="flex items-center text-green-600 text-xs font-bold" title="Connected to Global Server">
                 <Wifi size={14} className="mr-1" /> Online
               </div>
               <div className="text-[10px] text-gray-600 font-mono">Room: {appId.substring(0,8)}...</div>
             </div>
          )}
        </div>

        {userData && (
          <div className="flex items-center space-x-6 text-sm font-mono">
            <div className="flex items-center text-gray-400">
              <User size={14} className="mr-2" /> {userData.username}
            </div>
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              ${userData.credits}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative">
        {/* Notification Wrapper for centering */}
        {notification && (
          <div className="absolute top-4 w-full flex justify-center z-50 pointer-events-none">
            <div className="bg-yellow-600 text-black px-6 py-2 rounded-full font-bold shadow-lg animate-bounce border border-yellow-500 pointer-events-auto">
              {notification}
            </div>
          </div>
        )}

        {/* HQ Damage Overlay - Global - Fixed Stacking */}
        {view === 'game' && hqDamage && gameState?.status !== 'finished' && (
           <div key={hqDamage.id} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="text-9xl font-black text-red-600 drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-pulse flex items-center">
                    <span className="text-6xl mr-2">-</span>{hqDamage.amount}
                </div>
           </div>
        )}

        {/* CARD SPLASH OVERLAY - Global */}
        {splashCard && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="text-4xl font-black text-yellow-500 mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase tracking-widest">OPPONENT PLAYED</div>
                <Card cardId={splashCard.id} size="large" disabled className="shadow-2xl" />
             </div>
          </div>
        )}

        {/* Card Inspector Modal - Global */}
        {inspectCard && (
          <Modal onClose={() => setInspectCard(null)}>
             <div className="flex flex-col items-center">
                <Card cardId={inspectCard.id} size="large" disabled />
             </div>
          </Modal>
        )}

        {view === 'home' && <RenderHome setView={setView} setShowTutorial={setShowTutorial} showTutorial={showTutorial} activateTestMode={activateTestMode} />}
        {view === 'lobby' && <RenderLobby setView={setView} matchesList={matchesList} createMatch={createMatch} joinMatch={joinMatch} />}
        {view === 'game' && 
          <GameView 
             gameState={gameState}
             user={user}
             activeMatch={activeMatch}
             myMana={myMana}
             myHp={myHp}
             enemyHp={enemyHp}
             myHand={myHand}
             myBoard={myBoard}
             enemyBoard={enemyBoard}
             selectedUnitId={selectedUnitId}
             visualEffects={visualEffects}
             isMyTurn={isMyTurn}
             handleCancelMatch={handleCancelMatch}
             handleSurrender={handleSurrender}
             handleLeaveClean={handleLeaveClean}
             handleAttack={handleAttack}
             handleBoardClick={handleBoardClick}
             handlePlayCard={handlePlayCard}
             handleEndTurn={handleEndTurn}
             CARD_DATABASE={CARD_DATABASE}
             hqHitAnim={null} // Removed localized animation for global overlay
             isProcessing={isProcessing}
          />
        }
        {view === 'collection' && <RenderCollection setView={setView} userData={userData} listCardForSale={listCardForSale} setInspectCard={setInspectCard} />}
        {view === 'market' && <RenderMarket setView={setView} userData={userData} marketListings={marketListings} loading={loading} buyCard={buyCard} user={user} setInspectCard={setInspectCard} />}
      </main>
    </div>
  );
}