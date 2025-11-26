# TODO

## UI Tweaks
- [x] Fix Air Strike notification
    - If attack is successful do not show the notification to player playing the card
    - If attack fails due to opponent having a Radar Tower then show the card to both players with a big X and notification.
    - Reduce the duration of the notification from 6 seconds to 1.2
    - Fix notification z to appear with card instead of behind blur overlay 
- [x] Before showing Victory and Defeat screens give pause to allow the killing blow to play out.

## Refactor
- [ ] Reduce size of App.jsx

## New functionality
- [ ] Add AI opponent for solo play.

## Bugs
- [ ] Cleanup zombie matches
- [X] prevent joining own matches.
- [ ] Prevent guest from joining abandoned/zombie matches

## New game mechanics:
- [ ] Reinforcements: When a player's hand runs out of cards, replenish their hand from barracks; each card can only be played once from barracks, including starting hand, until all cards have been played.
- [ ] Reinforcements: When all cards have been played from hand and barracks. replenish barracks with all non-deployed cards, and then refresh player's hand from barracks.

### Card effect adjustments
- [x] Reduce Radar Station cost to 3
- [x] Reduce Bunker cost to 2
- [x] Reduce Field Hospital cost to 1
- [ ] Reduce cost of Sherman and Panzer tanks to 3
- [ ] Reduce cost of Tiger tanks to 4

### New Passive cards
- [x] While a Concrete Bunker is deployed it takes damage instead of the HQ when the HQ is targeted
- [x] Radars negate Air Raid effect
- [x] Field Hospital heals HQ +1 up to max HP each round it is deployed on the field
- [x] Commander cards give +2/+2 to adjacent units
- [x] Supply Truck one time active effect restores up to 4 supplies (click on card to reveal "use" button). passive gives all units +1 attack.
- [x] Forward HQ passive gives all units +1/+1; No active effect; Invlunerable - HP is infinite
