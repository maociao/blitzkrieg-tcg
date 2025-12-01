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
  User,
  RefreshCw,
  Check,
  X,
  Flag
} from 'lucide-react';

import { auth, db, appId } from './firebase';
import { CARD_DATABASE } from './data/cards';
import { GameProvider } from './context/GameContext';
import { getAiMove } from './services/gemini';
import { calculateBuffedBoard } from './utils/gameLogic';

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
  const [artSeed, setArtSeed] = useState(null);
  const [artOverrides, setArtOverrides] = useState({});
  const [surrenderEffect, setSurrenderEffect] = useState(null); // Stores text or null

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

  // --- Global Art Overrides Sync ---
  useEffect(() => {
    if (!user) return;
    // Fix: 'art_overrides' is a collection (5 segments), so we need a doc inside it ('global') to make 6 segments.
    const artRef = doc(db, 'artifacts', appId, 'public', 'data', 'art_overrides', 'global');
    const unsub = onSnapshot(artRef, (snap) => {
      if (snap.exists()) {
        setArtOverrides(snap.data());
      }
    });
    return () => unsub();
  }, [user]);

  const saveArtOverride = async () => {
    if (!inspectCard || !artSeed) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'art_overrides', 'global'), {
        [inspectCard.id]: artSeed
      }, { merge: true });
      showNotif("Global Art Updated!");
      setArtSeed(null);
    } catch (e) {
      console.error("Art save failed", e);
      showNotif("Failed to save art.");
    }
  };

  // --- User Data Sync & Test Mode ---
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    const unsub = onSnapshot(userRef, async (docSnap) => {
      setConnectionError(null);

      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('test') === 'true';
      const isResetMode = urlParams.get('test') === 'reset';

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
          const allCards = Object.keys(CARD_DATABASE).filter(id => !CARD_DATABASE[id].isToken);
          if (data.collection.length < allCards.length) {
            await updateDoc(userRef, { collection: allCards, credits: 1000 });
            showNotif("TEST MODE ACTIVATED: Collection Unlocked!");
          }
        } else if (isResetMode) {
          // Reset if data deviates from starter
          if (data.credits !== 100 || data.collection.length !== starterDeck.length) {
            await setDoc(userRef, {
              credits: 100,
              collection: starterDeck,
              wins: 0,
              losses: 0,
              username: data.username // Keep username
            });
            showNotif("ACCOUNT RESET: Back to basics.");
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
          initialData.collection = Object.keys(CARD_DATABASE).filter(id => !CARD_DATABASE[id].isToken);
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
    const allCards = Object.keys(CARD_DATABASE).filter(id => !CARD_DATABASE[id].isToken);
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
      const now = Date.now();
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.status === 'waiting') {
          // Heartbeat Check (30s timeout)
          let isLive = true;
          if (d.lastActive) {
            // Handle Firestore Timestamp or potential null pending write
            const millis = d.lastActive.toMillis ? d.lastActive.toMillis() : now;
            if (now - millis > 30000) isLive = false;
          }
          if (isLive) m.push({ id: doc.id, ...d });
        }
      });
      setMatchesList(m);
    });
    return () => unsub();
  }, [view, user]);

  const createMatch = async () => {
    setLoading(true);
    try {
      const expireAt = new Date();
      expireAt.setHours(expireAt.getHours() + 24); // TTL: 24 hours from now

      const matchRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        hostId: user.uid,
        hostName: userData.username,
        status: 'waiting',
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(), // For lobby "online" check
        expireAt: expireAt,            // For Firestore TTL auto-deletion
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

  const createAiMatch = async () => {
    setLoading(true);
    try {
      const expireAt = new Date();
      expireAt.setHours(expireAt.getHours() + 1); // AI matches are short

      // Generate AI Deck/Hand
      const allCards = Object.keys(CARD_DATABASE).filter(id => !CARD_DATABASE[id].isToken);
      const combatCards = allCards.filter(id => CARD_DATABASE[id].type !== 'support');
      const supportCards = allCards.filter(id => CARD_DATABASE[id].type === 'support');

      // Simple random hand generation for AI (Unique Supports, 5 Combat)
      let aiHand = [];

      // Select 2 Unique Support Cards
      // supportCards comes from Object.keys, so they are already unique IDs. 
      // Just shuffle and take 2 to ensure no duplicates.
      const shuffledSupports = [...supportCards].sort(() => 0.5 - Math.random());
      aiHand = [...aiHand, ...shuffledSupports.slice(0, 2)];

      // Select 5 Combat Cards (with replacement allowed, as per original AI logic)
      for (let i = 0; i < 5; i++) aiHand.push(combatCards[Math.floor(Math.random() * combatCards.length)]);

      // Shuffle final hand
      aiHand = aiHand.sort(() => 0.5 - Math.random());

      const surpriseAttack = Math.random() < 0.5;

      // BALANCING: If AI goes second (!surpriseAttack), give it a Supply Crate
      if (!surpriseAttack) {
        aiHand.push('item_coin');
      }

      const matchRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        hostId: user.uid,
        hostName: userData.username,
        guestId: 'AI_COMMANDER',
        guestName: 'Gemini AI',
        status: 'active', // Start active immediately
        turn: surpriseAttack ? 'guest' : 'host',
        startingSide: surpriseAttack ? 'guest' : 'host',
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        expireAt: expireAt,
        hostBoard: [],
        guestBoard: [],
        hostHand: [],
        guestHand: aiHand, // Pre-populated AI Hand
        hostHP: 20,
        guestHP: 20,
        hostMana: 1,
        guestMana: 1,
        maxMana: 1,
        turnCount: 1,
        lastEffects: [],
        lastAction: surpriseAttack ? 'Surprise Attack! AI moves first.' : 'AI Match Started',
        isAiMatch: true // Flag for AI logic
      });
      joinMatch(matchRef.id, true);
    } catch (e) {
      console.error(e);
      showNotif("Failed to start AI match.");
    }
  };

  const joinMatch = (matchId, isHost = false) => {
    setActiveMatch({ id: matchId, isHost });
    setRewardClaimed(false);
    setView('game');
  };

  // --- Host Heartbeat ---
  useEffect(() => {
    if (!activeMatch || !activeMatch.isHost || !user) return;

    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);

    // Pulse every 10s
    const interval = setInterval(() => {
      // Keep match alive in Lobby (lastActive) AND postpone TTL deletion (expireAt)
      const expireAt = new Date();
      expireAt.setHours(expireAt.getHours() + 24);

      updateDoc(matchRef, {
        lastActive: serverTimestamp(),
        expireAt: expireAt
      }).catch(e => console.warn("Heartbeat fail", e));
    }, 10000);

    return () => clearInterval(interval);
  }, [activeMatch, user]);

  const grantWinReward = async () => {
    if (!userData || !user) return;
    const keys = Object.keys(CARD_DATABASE).filter(id => !CARD_DATABASE[id].isToken);
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
        // CRITICAL FIX: Prevent Host from joining as Guest (Self-Play Exploit)
        if (data.hostId === user.uid) {
          // If we reached here, the UI likely sent them as guest, or they manipulated state.
          // We can either switch them to host or kick them. 
          // For safety against the exploit, we stop the "Guest Join" db write.
          if (joiningRef.current) return; // Already joining?

          // If they are the host, they shouldn't be here as guest. 
          // But if we want to support "Resume", the UI should have passed isHost=true.
          // If we are here, isHost is false. So this is an error/exploit case.
          console.warn("Prevented self-join.");
          // showNotif("Reconnecting as Host..."); 
          // optional: setActiveMatch({ ...activeMatch, isHost: true }); 
          // For now, just return to avoid the DB write that causes the bug.
          return;
        }

        if (!data.guestId && !joiningRef.current) {
          joiningRef.current = true; // Prevent loop
          const surpriseAttack = Math.random() < 0.5;
          try {
            await updateDoc(matchRef, {
              guestId: user.uid,
              guestName: userData.username,
              status: 'active',
              turn: surpriseAttack ? 'guest' : 'host',
              startingSide: surpriseAttack ? 'guest' : 'host', // Track who started for Coin logic
              hostHP: 20,
              guestHP: 20,
              hostMana: 1,
              guestMana: 1,
              maxMana: 1,
              turnCount: 1,
              hostBoard: [],
              guestBoard: [],
              hostHand: [],
              guestHand: [],
              lastEffects: [],
              lastAction: surpriseAttack ? 'Surprise Attack! Guest moves first.' : 'Game Start'
            });
          } catch (e) {
            console.error("Join error:", e);
            joiningRef.current = false; // Reset on error
            showNotif("Join failed. Connection error?");
            handleLeaveClean();
          }
        } else if (data.guestId && data.guestId !== user.uid) {
          showNotif("Match is full!");
          handleLeaveClean();
        }
      } else {
        setGameState(data);
      }
    }, (error) => {
      console.error("Match sync error:", error);
      showNotif("Connection Lost. Returning to base.");
      handleLeaveClean();
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

      // Filter for Unique Support Cards (must be unique types)
      const uniqueSupportCards = [...new Set(supportCards)].sort(() => 0.5 - Math.random());

      let hand = [];
      const supportsNeeded = 2;
      const combatNeeded = 5; // Increased to 5

      hand = [...hand, ...uniqueSupportCards.slice(0, supportsNeeded)];
      hand = [...hand, ...combatCards.slice(0, combatNeeded)];

      // If we couldn't fill the hand (e.g. not enough unique supports or combat cards), fill with remaining randoms
      if (hand.length < (supportsNeeded + combatNeeded)) {
        const remaining = fullCollection.filter(c => !hand.includes(c)).sort(() => 0.5 - Math.random());
        hand = [...hand, ...remaining.slice(0, (supportsNeeded + combatNeeded) - hand.length)];
      }

      // BALANCING: Second Player gets a Supply Crate (Coin)
      const mySide = isHost ? 'host' : 'guest';
      // If startingSide is recorded, use it. If not (legacy matches), fallback to turnCount logic or ignore.
      // We assume new matches have startingSide.
      if (gameState.startingSide && gameState.startingSide !== mySide) {
        hand.push('item_coin');
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

      // Only process if the raw data changed OR if we need to check for staleness
      // But actually, we just want to filter stale ones.
      // If we filter stale ones, and the result is empty, we set empty.

      const now = Date.now();
      const recentEffects = gameState.lastEffects.filter(fx => {
        // Check if effect is recent (within 2 seconds)
        // fx.id is the timestamp
        return (now - fx.id) < 2000;
      });

      const recentEffectsStr = JSON.stringify(recentEffects);

      if (recentEffectsStr !== prevEffectsRef.current) {
        // New valid effects detected!
        const newEffects = {};
        recentEffects.forEach(fx => {
          newEffects[fx.unitId] = { type: fx.type, id: fx.id };
        });

        // Only update state if we have something, or if we need to clear
        if (Object.keys(newEffects).length > 0 || prevEffectsRef.current !== "[]") {
          setVisualEffects(newEffects);

          // Clear effects after 1.5s (local cleanup)
          if (Object.keys(newEffects).length > 0) {
            setTimeout(() => {
              setVisualEffects({});
            }, 1500);
          }
        }

        prevEffectsRef.current = recentEffectsStr;
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

  const myBoardRaw = gameState ? (activeMatch?.isHost ? gameState.hostBoard : gameState.guestBoard) || [] : [];
  const enemyBoardRaw = gameState ? (activeMatch?.isHost ? gameState.guestBoard : gameState.hostBoard) || [] : [];

  const myBoard = calculateBuffedBoard(myBoardRaw);
  const enemyBoard = calculateBuffedBoard(enemyBoardRaw);

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
        const lastAction = gameState.lastAction;
        const isMyAction = lastAction.startsWith(activeMatch.isHost ? 'Host' : 'Guest');

        // SURPRISE ATTACK NOTIFICATION
        if (lastAction.includes("Surprise Attack!")) {
          showNotif(lastAction);
        }

        // Find if action mentions a tactic card
        const tactic = Object.values(CARD_DATABASE).find(c =>
          c.type === 'tactic' && lastAction.includes(c.name)
        );

        if (tactic) {
          const isIntercepted = lastAction.includes("intercepted by Radar") || lastAction.includes("negated by Radar");

          // Show if:
          // 1. I am the victim (Opponent played it)
          // 2. OR it was intercepted (Show to both for clarity)
          if (!isMyAction || isIntercepted) {
            setSplashCard({ ...tactic, intercepted: isIntercepted });
            setTimeout(() => setSplashCard(null), 2000);
          }
        } else if (lastAction.includes("surrendered")) {
          // Determine if I surrendered
          const isHost = activeMatch.isHost;
          const surrenderingRole = lastAction.split(' ')[0]; // 'Host' or 'Guest'
          const isMe = (surrenderingRole === 'Host' && isHost) || (surrenderingRole === 'Guest' && !isHost);

          const text = isMe ? "YOU SURRENDERED" : "OPPONENT SURRENDERED";

          // showNotif removed - using overlay text only
          setSurrenderEffect(text);
          setTimeout(() => setSurrenderEffect(null), 2000);
        }
        prevLastAction.current = lastAction;
      }
    }
  }, [gameState, activeMatch]);

  // --- AI Turn Logic ---
  useEffect(() => {
    if (!gameState || !activeMatch || !gameState.isAiMatch) return;

    // If it's Guest's turn (AI) and I am the Host (Player) handling the AI
    if (gameState.turn === 'guest' && activeMatch.isHost && !isProcessing) {
      const runAiTurn = async () => {
        setIsProcessing(true);

        // 1. Simulate "Thinking" delay
        await new Promise(r => setTimeout(r, 1500));

        // 2. Prepare Buffed State for AI
        const aiBoardBuffed = calculateBuffedBoard(gameState.guestBoard);
        const playerBoardBuffed = calculateBuffedBoard(gameState.hostBoard);

        // 3. Get AI Move
        // Note: We pass the buffed boards so AI sees stats correctly
        const move = await getAiMove(gameState, gameState.guestHand, aiBoardBuffed, playerBoardBuffed);
        console.log("AI Decided:", move);

        try {
          // 4. Execute Move using Existing Handlers
          if (move.action === 'SURRENDER') {
            await handleSurrender('guest');
          }
          else if (move.action === 'PLAY_CARD' && move.cardId) {
            const handIndex = gameState.guestHand.indexOf(move.cardId);
            if (handIndex !== -1) {
              await handlePlayCard(move.cardId, handIndex, 'guest');
            } else {
              await handleEndTurn('guest');
            }
          }
          else if (move.action === 'ATTACK' && typeof move.attackerIndex === 'number') {
            const attacker = aiBoardBuffed[move.attackerIndex];
            if (attacker) {
              // We pass the instanceId so handleAttack finds the exact unit
              await handleAttack(move.targetIndex, attacker.instanceId, 'guest');
            } else {
              // AI tried to attack with missing unit or invalid index
              await handleEndTurn('guest');
            }
          }
          else if (move.action === 'USE_ABILITY' && typeof move.unitIndex === 'number') {
            const unit = aiBoardBuffed[move.unitIndex];
            if (unit) {
              if (typeof move.targetIndex === 'number') {
                const target = aiBoardBuffed[move.targetIndex];
                if (target) {
                  await handleSupportAction(unit, target, move.targetIndex, 'guest');
                } else {
                  await handleEndTurn('guest');
                }
              } else {
                await handleUseAbility(unit, 'guest');
              }
            } else {
              await handleEndTurn('guest');
            }
          }
          else {
            // END_TURN or default
            await handleEndTurn('guest');
          }
        } catch (e) {
          console.error("AI execution error", e);
          // Ensure we don't get stuck
          await handleEndTurn('guest');
        }

        setIsProcessing(false);
      };

      runAiTurn();
    }
  }, [gameState, activeMatch]);

  const handleEndTurn = async (forcedSide = null) => {
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    if (isProcessing && !actualSide) return;
    if (!gameState) return;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;

    if (!actualSide) setIsProcessing(true); // UI trigger only
    setSelectedUnitId(null);
    const nextTurn = isHost ? 'guest' : 'host';

    // FIX: Calculate Mana based on absolute Turn Count to support Surprise Attacks (Guest First)
    // Round 1 (Turns 1-2): 1 Mana
    // Round 2 (Turns 3-4): 2 Mana
    const currentTurnCount = gameState.turnCount || (gameState.maxMana * 2 - (isHost ? 0 : 1)); // Fallback approximation
    const nextTurnCount = currentTurnCount + 1;
    const nextMaxMana = Math.min(Math.ceil(nextTurnCount / 2), 10);

    const nextPlayerBoardKey = isHost ? 'guestBoard' : 'hostBoard';

    // FIX: Robustly filter out dead units to prevent resurrection race conditions
    // FIX 2: Use Buffed HP for this check too!
    const boardToCheck = gameState[nextPlayerBoardKey];
    const boardBuffed = calculateBuffedBoard(boardToCheck);

    const nextPlayerBoard = boardToCheck
      .filter((_, i) => boardBuffed[i].currentHp > 0)
      .map(u => ({
        ...u,
        canAttack: true
      }));

    // Passive: Field Hospital (Heal HQ)
    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const myHpKey = isHost ? 'hostHP' : 'guestHP';
    const myCurrentBoard = gameState[myBoardKey];
    let newMyHp = gameState[myHpKey];
    const medics = myCurrentBoard.filter(u => u.id === 'supp_medic');
    if (medics.length > 0) {
      newMyHp = Math.min(newMyHp + medics.length, 20);
      if (newMyHp > gameState[myHpKey]) {
        showNotif(`Field Hospital restored ${medics.length} HQ Health!`);
      }
    }

    const update = {
      turn: nextTurn,
      turnCount: nextTurnCount,
      maxMana: nextMaxMana,
      hostMana: nextMaxMana,
      guestMana: nextMaxMana,
      [nextPlayerBoardKey]: nextPlayerBoard,
      [myHpKey]: newMyHp,
      lastAction: `Turn pass to ${nextTurn}`,
      lastEffects: []
    };
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
    await updateDoc(matchRef, update);
    setTimeout(() => { if (!actualSide) setIsProcessing(false); }, 1000);
  };

  const handlePlayCard = async (cardId, index, forcedSide = null) => {
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    if (isProcessing && !actualSide) return;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;
    const myTurn = isHost ? 'host' : 'guest';
    if (gameState.turn !== myTurn) { if (!actualSide) showNotif("Not your turn!"); return; }

    const manaKey = isHost ? 'hostMana' : 'guestMana';
    const handKey = isHost ? 'hostHand' : 'guestHand';
    const boardKey = isHost ? 'hostBoard' : 'guestBoard';

    const cardData = CARD_DATABASE[cardId];
    if (gameState[manaKey] < cardData.cost) { if (!actualSide) showNotif("Not enough supplies!"); return; }

    if (!actualSide) setIsProcessing(true);
    const lockTime = cardData.type === 'tactic' ? 2000 : 1000;

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

        // Passive: Radar Negation
        const currentEnemyBoard = gameState[enemyBoardKey];
        if (currentEnemyBoard.some(u => u.id === 'supp_radar')) {
          showNotif("Air Strike intercepted by Radar!");
          const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
          await updateDoc(matchRef, {
            [handKey]: newHand,
            [manaKey]: gameState[manaKey] - cardData.cost,
            lastAction: `${isHost ? 'Host' : 'Guest'} Air Strike negated by Radar!`,
            lastEffects: []
          });
          setTimeout(() => { if (!actualSide) setIsProcessing(false); }, 1000);
          return;
        }

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
          lastAction: `${isHost ? 'Host' : 'Guest'} launched Air Strike!`,
          lastEffects: fxList // Trigger explosions on ALL targets
        });

        // Delayed Cleanup for Tactic (Async Wait)
        await new Promise(r => setTimeout(r, 2500));

        // FIX: Use Buffed HP for survival check
        const enemyBoardForCleanup = updatedEnemyBoard; // This is the raw state with damage applied
        const enemyBoardBuffed = calculateBuffedBoard(enemyBoardForCleanup);

        const finalCleanEnemy = enemyBoardForCleanup.filter((_, i) => enemyBoardBuffed[i].currentHp > 0);

        if (finalCleanEnemy.length !== updatedEnemyBoard.length) {
          await updateDoc(matchRef, { [enemyBoardKey]: finalCleanEnemy });
        }
        if (!actualSide) setIsProcessing(false);

        return;
      }
      if (cardData.effect === 'restore_mana_1') {
        const newMana = Math.min(gameState[manaKey] + 1, 10); // Cap at 10? Or allow overflow?
        // Usually maxMana is the cap for regeneration, but coins can exceed temporarily or just fill up.
        // Let's just add 1.

        // Let's just add 1.

        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);
        await updateDoc(matchRef, {
          [handKey]: newHand,
          [manaKey]: gameState[manaKey] + 1, // Net change: -0 cost + 1 = +1
          lastAction: `${isHost ? 'Host' : 'Guest'} used Supply Crate!`,
          lastEffects: []
        });
        setTimeout(() => { if (!actualSide) setIsProcessing(false); }, 500);
        return;
      }
    } else {
      newBoard.push(unit);
    }

    const update = {
      [handKey]: newHand,
      [boardKey]: newBoard,
      [manaKey]: gameState[manaKey] - cardData.cost,
      lastAction: `${isHost ? 'Host' : 'Guest'} deployed ${cardData.name}`,
      lastEffects: []
    };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);
    setTimeout(() => { if (!actualSide) setIsProcessing(false); }, lockTime);
  };

  const handleUseAbility = async (unit, forcedSide = null) => {
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    if (isProcessing && !actualSide) return;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) {
      if (!actualSide) showNotif("Not your turn!");
      return;
    }
    if (unit.isAbilityUsed) {
      if (!actualSide) showNotif("Ability already used!");
      return;
    }
    if (!unit.activeAbility) return;

    if (!actualSide) setIsProcessing(true);
    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const myBoard = [...gameState[myBoardKey]];
    const unitIndex = myBoard.findIndex(u => u.instanceId === unit.instanceId);

    if (unitIndex === -1) { setIsProcessing(false); return; }

    const update = {};
    const fxList = [];
    const uniqueFxId = Date.now();

    if (unit.activeAbility === 'restore_mana_full') {
      const manaKey = isHost ? 'hostMana' : 'guestMana';
      const maxMana = gameState.maxMana;

      update[manaKey] = maxMana;
      update.lastAction = `${unit.name} fully resupplied forces!`;
      fxList.push({ unitId: unit.instanceId, type: 'action_buff', id: uniqueFxId });
      showNotif(`Supplies Fully Restored!`);
    }

    // Mark used
    myBoard[unitIndex].isAbilityUsed = true;
    myBoard[unitIndex].canAttack = false; // Using ability consumes action
    update[myBoardKey] = myBoard;
    update.lastEffects = fxList;

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id), update);

    setSelectedUnitId(null);
    setTimeout(() => { if (!actualSide) setIsProcessing(false); }, 1000);
  };

  const handleSupportAction = async (supportUnit, targetUnit, targetIndex, forcedSide = null) => {
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    if (isProcessing && !actualSide) return;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) {
      if (!actualSide) showNotif("Not your turn!");
      return;
    }
    if (supportUnit.isAbilityUsed) {
      if (!actualSide) showNotif("Support ability already used!");
      return;
    }
    if (supportUnit.canAttack === false) {
      if (!actualSide) showNotif("Support unit is busy!");
      return;
    }
    if (targetUnit.type === 'support') {
      if (!actualSide) showNotif("Cannot support another Support unit!");
      return;
    }

    // Check if unit has a support effect (Passive-only supports cannot act)
    if (!supportUnit.supportEffect) {
      // Optional: Show notification or just return
      // showNotif("This unit has no active support ability."); 
      return;
    }

    // BALANCING: Bunker can only target Infantry
    if (supportUnit.id === 'supp_bunker' && targetUnit.type !== 'infantry') {
      if (!actualSide) showNotif("Bunkers can only fortify Infantry!");
      return;
    }

    if (!actualSide) setIsProcessing(true);

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
    setTimeout(() => { if (!actualSide) setIsProcessing(false); }, 1200);
  };

  const handleAttack = async (targetIndex = -1, explicitAttackerId = null, forcedSide = null) => {
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    if (isProcessing && !actualSide) return;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;
    if (gameState.turn !== (isHost ? 'host' : 'guest')) return;

    const myBoardKey = isHost ? 'hostBoard' : 'guestBoard';
    const enemyBoardKey = isHost ? 'guestBoard' : 'hostBoard';
    const enemyHpKey = isHost ? 'guestHP' : 'hostHP';

    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', activeMatch.id);

    // Use Buffed Boards for Stats Calculation (Commanders etc)
    const myBoardRaw = [...gameState[myBoardKey]];
    const myBoardBuffed = calculateBuffedBoard(myBoardRaw);

    let attacker;
    let attackerIndex = -1;

    if (explicitAttackerId) {
      attacker = myBoardBuffed.find(u => u.instanceId === explicitAttackerId);
      attackerIndex = myBoardRaw.findIndex(u => u.instanceId === explicitAttackerId);
    } else if (selectedUnitId) {
      attacker = myBoardBuffed.find(u => u.instanceId === selectedUnitId);
      attackerIndex = myBoardRaw.findIndex(u => u.instanceId === selectedUnitId);
    } else {
      attacker = myBoardBuffed.find(u => u.canAttack && u.type !== 'support');
      attackerIndex = myBoardRaw.findIndex(u => u.canAttack && u.type !== 'support');
    }

    if (!attacker) {
      if (!actualSide) showNotif("No ready combat units available!");
      return;
    }
    if (attacker.type === 'support') {
      if (!actualSide) showNotif("Support units cannot attack!");
      return;
    }
    if (attacker.canAttack === false) {
      if (!actualSide) showNotif("Unit is recovering (Zzz)!");
      return;
    }

    // BALANCING: Snipers cannot attack Air - REVERTED
    // if (attacker.id === 'inf_sniper') { ... }

    if (!actualSide) setIsProcessing(true);

    if (attackerIndex !== -1) {
      myBoardRaw[attackerIndex].canAttack = false;
    }

    let update = { [myBoardKey]: myBoardRaw };
    const fxList = [];
    const uniqueFxId = Date.now();

    fxList.push({ unitId: attacker.instanceId, type: 'action_attack', id: uniqueFxId });

    if (targetIndex === -1) {
      // Passive: Bunker Intercept
      const enemyBoardRaw = [...gameState[enemyBoardKey]];
      const bunkerIndex = enemyBoardRaw.findIndex(u => u.id === 'supp_bunker');

      if (bunkerIndex !== -1) {
        const bunker = enemyBoardRaw[bunkerIndex];
        bunker.currentHp -= attacker.atk; // Attacker uses buffed ATK

        showNotif("Bunker absorbed the attack!");
        fxList.push({ unitId: bunker.instanceId, type: 'damage', id: uniqueFxId + 1 });

        update[enemyBoardKey] = enemyBoardRaw;
        update.lastAction = `${attacker.name} hit Bunker (Guard)!`;
        update.lastEffects = fxList;
      } else {
        const newEnemyHp = gameState[enemyHpKey] - attacker.atk;
        update[enemyHpKey] = newEnemyHp;
        update.lastAction = `${attacker.name} attacked Command Post!`;
        update.lastEffects = fxList;

        if (newEnemyHp <= 0) {
          update.status = 'finished';
          // Correct Winner Logic: If I am Host (Attacker), I win. If I am Guest (Attacker), I win.
          // But wait, 'isHost' here is "Am I the attacker?".
          // If isHost is true, attacker is Host. Winner is Host ID.
          // If isHost is false, attacker is Guest. Winner is Guest ID.
          update.winner = isHost ? gameState.hostId : gameState.guestId;
        }
      }
    } else {
      const enemyBoardRaw = [...gameState[enemyBoardKey]];
      const enemyBoardBuffed = calculateBuffedBoard(enemyBoardRaw);

      const target = enemyBoardRaw[targetIndex];
      const targetBuffed = enemyBoardBuffed[targetIndex];

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
        // Recoil
        if (attackerIndex !== -1) {
          myBoardRaw[attackerIndex].currentHp -= targetBuffed.atk; // Target uses buffed ATK
          // FIX 1: Show recoil damage ONLY if enemy had attack power
          if (targetBuffed.atk > 0) {
            fxList.push({ unitId: attacker.instanceId, type: 'damage', id: uniqueFxId + 3 });
          }
        }
      }

      // FIX 2: DELAYED DEATH - Keep units in array for animation
      update[enemyBoardKey] = enemyBoardRaw;
      update[myBoardKey] = myBoardRaw;

      update.lastAction = `${attacker.name} engaged ${target.name}`;
      update.lastEffects = fxList;
    }

    await updateDoc(matchRef, update);
    setSelectedUnitId(null);

    // Delayed Cleanup Step (Async Wait to prevent AI Race Conditions)
    await new Promise(r => setTimeout(r, 1000));

    const finalEnemy = update[enemyBoardKey] || [...gameState[enemyBoardKey]];
    const finalMy = update[myBoardKey];

    // FIX: Use Buffed HP to determine survival (so Buffs act as real HP)
    const finalEnemyBuffed = calculateBuffedBoard(finalEnemy);
    const finalMyBuffed = calculateBuffedBoard(finalMy);

    const cleanEnemy = finalEnemy.filter((_, i) => finalEnemyBuffed[i].currentHp > 0);
    const cleanMy = finalMy.filter((_, i) => finalMyBuffed[i].currentHp > 0);

    if (cleanEnemy.length !== finalEnemy.length || cleanMy.length !== finalMy.length) {
      await updateDoc(matchRef, {
        [enemyBoardKey]: cleanEnemy,
        [myBoardKey]: cleanMy
      });
    }

    if (!actualSide) setIsProcessing(false);
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

  const handleSurrender = async (forcedSide = null) => {
    if (!activeMatch || !gameState) return;
    const actualSide = (typeof forcedSide === 'string') ? forcedSide : null;
    const isHost = actualSide ? (actualSide === 'host') : activeMatch.isHost;

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
    <GameProvider value={{ artOverrides, artSeed }}>
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
                <div className="text-[10px] text-gray-600 font-mono">Room: {appId.substring(0, 8)}...</div>
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
            <div className="absolute top-4 w-full flex justify-center z-[300] pointer-events-none">
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

          {/* SURRENDER OVERLAY - Global */}
          {surrenderEffect && (
            <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col items-center">
                <Flag size={128} className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
                <div className="text-4xl font-black text-white mt-4 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">{surrenderEffect}</div>
              </div>
            </div>
          )}

          {/* CARD SPLASH OVERLAY - Global */}
          {splashCard && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="flex flex-col items-center animate-in zoom-in duration-500 relative">
                <div className={`text-4xl font-black mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase tracking-widest ${splashCard.intercepted ? 'text-red-600' : 'text-yellow-500'}`}>
                  {splashCard.intercepted ? 'INTERCEPTED' : 'OPPONENT PLAYED'}
                </div>
                <div className="relative">
                  <Card cardId={splashCard.id} size="large" disabled className="shadow-2xl" />
                  {splashCard.intercepted && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                      <X size={128} className="text-red-600 drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-pulse" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card Inspector Modal - Global */}
          {inspectCard && (
            <Modal onClose={() => { setInspectCard(null); setArtSeed(null); }}>
              <div className="flex flex-col items-center">
                <Card cardId={inspectCard.id} size="large" disabled customSeed={artSeed} allowFlip={true} />
                {userData?.credits >= 1000 && (
                  <div className="mt-4 flex gap-3">
                    {!artSeed ? (
                      <button
                        onClick={() => setArtSeed(Date.now())}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                      >
                        <RefreshCw size={16} />
                        Regenerate Art (Test Mode)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setArtSeed(null)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold shadow-lg flex items-center gap-2"
                        >
                          <X size={16} /> Cancel
                        </button>
                        <button
                          onClick={() => setArtSeed(Date.now())}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg flex items-center gap-2"
                        >
                          <RefreshCw size={16} /> Retry
                        </button>
                        <button
                          onClick={saveArtOverride}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg flex items-center gap-2 animate-pulse"
                        >
                          <Check size={16} /> Save Global
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Modal>
          )}

          {view === 'home' && <RenderHome setView={setView} setShowTutorial={setShowTutorial} showTutorial={showTutorial} activateTestMode={activateTestMode} />}
          {view === 'lobby' && <RenderLobby setView={setView} matchesList={matchesList} createMatch={createMatch} joinMatch={joinMatch} user={user} createAiMatch={createAiMatch} />}
          {view === 'game' && <GameView
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
            handleUseAbility={handleUseAbility}
            CARD_DATABASE={CARD_DATABASE}
            hqHitAnim={null} // Removed localized animation for global overlay
            isProcessing={isProcessing}
          />
          }
          {view === 'collection' && <RenderCollection setView={setView} userData={userData} listCardForSale={listCardForSale} setInspectCard={setInspectCard} />}
          {view === 'market' && <RenderMarket setView={setView} userData={userData} marketListings={marketListings} loading={loading} buyCard={buyCard} user={user} setInspectCard={setInspectCard} />}
        </main>
      </div>
    </GameProvider>
  );
}