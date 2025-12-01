# TODO

## UI Tweaks
- [x] Fix Air Strike notification
    - If attack is successful do not show the notification to player playing the card
    - If attack fails due to opponent having a Radar Tower then show the card to both players with a big X and notification.
    - Reduce the duration of the notification from 6 seconds to 1.2
    - Fix notification z to appear with card instead of behind blur overlay 
- [x] Before showing Victory and Defeat screens give pause to allow the killing blow to play out.
- [ ] Add card sort and filter to collection view.
- [ ] Sort deck view by card type (support, instant, combat) 
- [ ] automatically select the first card in deployed hand at the beginning of a turn (already the case but indicator is not visible)

## Refactor
- [ ] Reduce size of App.jsx
- [x] AI should use existing handlers (handleEndTurn, handlePlayCard, handleUseAbility, handleSupportAction, handleAttack, etc.)
- [x] Add player hand count to AI prompt.
- [x] Add card description to cards on board for AI prompt.
- [x] Add last action to AI prompt
- [ ] Improve AI performance and wait time experience.
- [ ] AI scaling (should use same barracks/collection as player)

## New functionality
- [x] Add AI opponent for solo play.

## Bugs
- [X] Cleanup zombie matches & Implement TTL logic
- [X] prevent joining own matches.
- [X] Prevent guest from joining abandoned/zombie matches
- [ ] Handle when a player abandons in the middle of a match

## New game mechanics:
- [ ] Reinforcements: When a player's hand runs out of cards, replenish their hand from barracks; each card can only be played once from barracks, including starting hand, until all cards have been played. (undecided)
- [ ] Reinforcements: When all cards have been played from hand and barracks. replenish barracks with all non-deployed cards, and then refresh player's hand from barracks. (undecided)
- [ ] Attacking card must have attack HIGHER than the defending card's Defense to avoid a counter attack; if attack = defense, a counter attack occurs. (undecided)
- [ ] Concrete bunker and Field Hospital buffs only apply to infantry units
- [ ] New engineer support unit heals tanks units
- [ ] New hangar support unit heals air units

### Card effect adjustments
- [x] Reduce Radar Station cost to 3
- [x] Reduce Bunker cost to 2
- [x] Reduce Field Hospital cost to 1
- [x] Reduce cost of Sherman and Panzer tanks to 3
- [X] Reduce cost of Tiger tanks to 4
- [X] Increase P-51 Mustang HP to 4
- [X] Reduce cost of Commanders to 6
- [X] Reduce cost of Forward HQ to 5
- [ ] Reduce cost of Radar Station to 2
- [ ] Reduce defense of Radar Station to 4
- [ ] Remove the passive effect of commanders
- [ ] Increase p-51 Mustang defense to 4
- [ ] Use of supply crate should trigger the same visual effect as air raid
- [ ] Reverse the passive/active ability of the field hospital

### New Passive cards
- [x] While a Concrete Bunker is deployed it takes damage instead of the HQ when the HQ is targeted
- [x] Radars negate Air Raid effect
- [x] Field Hospital heals HQ +1 up to max HP each round it is deployed on the field
- [x] Commander cards give +2/+2 to adjacent units
- [x] Supply Truck one time active effect restores up to 4 supplies (click on card to reveal "use" button). passive gives all units +1 attack.
- [x] Forward HQ passive gives all units +1/+1; No active effect; Invlunerable - HP is infinite
