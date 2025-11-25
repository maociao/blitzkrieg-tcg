import React, { createContext, useContext } from 'react';

const GameContext = createContext({
  artOverrides: {},
  artSeed: null,
});

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children, value }) => (
  <GameContext.Provider value={value}>
    {children}
  </GameContext.Provider>
);
