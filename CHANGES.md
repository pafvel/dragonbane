# Change Log

## Version 1.4.0

- Character Sheet
    - Death Rolls now use the standard roll dialog.
    - Removed skill values for Magic tricks.
    - Equipping a weapon with quantity greater than one now only equips one weapon, not the entire stack.
    - Changed labels from main/offhand to left/right, matching the icons. The system currently doesn't make a difference between main and offhand, so this change will make it less confusing for some right-handed players.
    - Weapons, Armor and Helmets can be Tiny items.

- Journal
    - Minor formatting improvements in the Gear lists.

- Monsters
    - Monsters can't have spells anymore. They could before, but there was an error trying to cast spells because monsters don't have WP.

- Chat & Combat
    - Healing and damage can be applied from normal die rolls.


## Version 1.3.3
- Added boons & banes to die roll tooltip.

## Version 1.3.2
- Fix for NPC weapon actions not working.
- Reverted boons & banes in die roll tooltip.

## Version 1.3.1
- Fix for RollTables not working

## Version 1.3.0
- Character Sheet
    - Death Roll automation.
    - Confirmation dialog when deleting items from character.
- Weapons
    - Bane when using weapon with higher STR requirement than character's STR.
    - Lower STR requirement when wielding 1h weapon with both hands.
    - Bludgeoning can be combined with Slashing/Piercing.
- Spells
    - Magic tricks always succeed.
- Boons & Banes
    - Gear can have boons & banes.
    - Added boons & banes to die roll tooltip.
- YZE Combat integration
    - Default settings for Year Zero Combat (by @aMediocreDad).
        - will be applied the first time the module is loaded after this update.
- Localization
    - Added German localization (by KaiderWeise).
    - Updated Brazilian Portuguese localization (by Roberto Pedroso).


## Version 1.2.0
- Characters
    - Skill advancement automation. Contribution from @aMediocreDad.

## Version 1.1.0
- Weapons
    - New weapon feature: Unarmed. Unarmed weapons do not count towards weapons at hand.
    - All melee weapons can now Topple.
    - Toppling weapons get a Boon on Topple.
    - Fixed bug where pushing a weapon roll always resulted in the default action
- Characters
    - Prevent having more than 3 weapons at hand after dragging and dropping on the inventory tab.
- Monsters and NPCs
    - Items can be created on the inventory tab.
- Miscellaneous
    - Removed error message when deleted token is referenced in chat message
    - Chat message text is always selectable
    - Fixed spelling error in introduction journal.
    - Changed how Death Rolls are updated.
    - Disheartened is now written in full in the chat log.
    - Condition labels on the character sheet will be clipped if too long.
    - Added Brazilian Portuguese localization

## Version 1.0.0
- General
    - Added custom 3D dice for Dice So Nice.
    - Removed repetition on background image.
- Characters
    - Enabled dragging items from Observable characters.
    - Checking Memento on an item unchecks existing Memento.
- Spells
    - Changed label from Distance to Range in spell list journal.
    - Fixed double damage on spell crit.
    - Fixed CTRL/SHIFT+spell draining all WP.
    
## Version 0.0.4
- Characters
    - Create items from the inventory tab on the character sheet.
    - Option to hide skill from Trained Skills.
- Monsters
    - Weapons on the monster sheet can be right-clicked.
    - Monster weapon damage can be used with targeting.
- Chat & Combat
    - Added option to deal damage ignoring armor.
    - Actions on chat cards are only visible for owners.
    - Added attribute name after condition when prompted to push a roll.
    - Fixed bug where WP was not refunded when choosing that option on a spell crit on a pushed roll.
- Items
    - Count on items renamed to Quantity.
    - Added tooltips to skill sheet.
    - Added input validation for spell damage.
    - Thrown weapons are always considered melee weapons, even if range >= 10.
- Journal
    - Added instructions on how to use YZE Combat.
- General
    - Fixed some localization issues.
