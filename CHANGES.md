# Change Log

## Version 1.7.0
- Characters & NPCs
    - Added rest tracking and rest reset button on the Character sheet.
    - The WP box for NPCs will be visible even if the NPC doesn't have have abilities or spells. This was unintentionally added already in version 1.6.0.
    - Setting for hiding WP box on NPCs when WP is zero and the NPC doesn't have abilities or spells (enabled by default).
- Journals
    - Added box style for abilitiy enrichment: @DisplayAbilityBox.
    - Support for h3 tag in @DisplayTable.
- Miscellaneous
    - The rollItem macro now correctly considers targets.
    - Added helper function to update spells on actors: game.dragonbane.updateSpells(). Running this command in the console will check all spells on actors and overwrite each spell with the first found spell in the world that has the same name. The magic school will not be changed due to localization of the General spell school. Backing up the world before running this command is recommended.
- Bug fixes
    - Fix for weapon rolls not working without an active scene.
    - Fix for incorrect checkbox behavior when wearing memento.
    - Corrected input validation formula for spell damage.
    - Gracefully handle missing or incorrect magic school on spells.
- Updated/added localization
    - ES by Tarot
    - GE by @KaiderWeise
    - PT-BR by Roberto Pedroso | Shaolin
    - ZH-TW by Marc (YBY)

## Version 1.6.0
- Characters & NPCs
    - Characters can equip any gear.
        - Enable this feature using the Equip Items setting.
        - Equipped gear does not contribute towards encumbrance.
    - Newly created Characters & NPCs get their skills from the currently active core module
        - If no core module is active, they get skills from the world as before.
- Monsters
    - Monsters can receive and cast spells and magic tricks.
        - Monsters always succeed when casting spells.
    - Monsters don't get any skills on creation
        - Skills can be added manually, as usual
- Spells
    - Spells can heal using negative damage
        - If the spell's damage starts with a "-" sign, it's a healing spell
    - Spell targets are announced in chat messages.
    - Added WP change info in chat message for magic tricks.
- Miscellaneous
    - Added listeners so that [[/damage \<formula\>]] works in item and actor descriptions.

## Version 1.5.1
- Fix for Monster Defend not working.
- Fix for decks going out of sync if there were drawn cards when the draw deck is re-imported.
- Removed bonus when making ranged attack on prone target.
- Added Spanish localization (contribution by Tarot).

## Version 1.5.0

- Combat
    - Improved combat chat messages
        - Players with Observer permission or higher can view detailed damage info.
        - Damage dealt can be hidden from chat message based on permissions and configurable settings.
        - Fixed some minor formatting issues in chat messages.
    - Scrolling status text
        - Scrolling status text now support changes in in HP and WP. They follow the same rules for visibility as chat messages.
    - Automation
        - NPCs, Monster and Characters will get marked as Dead automatically based on configurable settings.
        - Attacks on a prone target automatically gets a Boon and bonus damage.

- Character Sheet
    - Prevent Advancement Marks from advancing skill beyond 18. Contributed by @Bithir.
    - Skill values can now go below base chance. If entering zero or empty value, it will reset to base chance.
    - Fix for character sheet sometimes not updating when skill value reset to base chance.
    - Added tooltips on Abilities tab, explaining how to add Profession, Kin and Heroic Abilities.

- Monster Sheet
    - Fix for performance bug when dropping table on monster sheet.
    - Fix for same monster attack sometime occuring twice in a row.

- Items Sheets
    - Support drag'n'drop for Abilities onto the Kin item sheet.
    - Character now updates properly when the Ability on the Kin sheet is changed.
    - Removed advancement checkbox from Skill sheet.
    - Support for attributes in Item Banes & Boons. Use the non-localized short attribute names: STR, CON, etc.

- Settings
    - Setting for minimum permission level to view amount of damage done to an actor.
    - Settings for automatically marking actors as Dead.

Localization
- Added italian localization. Contributed by @FR4NC35C0.


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
