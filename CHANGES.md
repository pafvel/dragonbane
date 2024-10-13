# Change Log

## Version 1.9.2

- Miscellaneous fixes

  - Fix for allowing dragon rolls to be pushed.
  - Fix for warning when weapon range is an empty string.
  - Fix for not being able to set WP to 0 on NPCs.
  - Fix for WP not updating correctly on older Foundry version.

- Journals

  - Edit button always visible in journals.
    - prevents an issue that sometimes makes the sheet offset a bit when displaying the edit button and that the invisible button doesn't show when you think it should.
  - Info boxes and tables can now have Header 2 title.
  - Nested list items now display correctly in room descriptions.
  - Hide trained flag now also hides the skill in NPC dscriptions.

- Localization

  - Updated localisation for pt-br (by Roberto Pedroso)
  - Updated localisation for zh-tw (by Marc Ye)

- For developers
  - Ensured that the CONFIG.DoD localisation values are used and moved everything to look at CONFIG.DoD (by @Bithir)
    - This makes it possible to programmatically extend weapon features and damage types, with localization support.

## Version 1.9.1

- Journals

  - Added display options for tables

- Fixes for bugs introduced in 1.9.0

  - Fixed incorrect calculation of movement bonus from ability
  - Fixed backpacks not working
  - Fix for same monster attack occuring twice in a row
  - Added missing localization key (by @xdy)

- Miscellaneous

  - Lowest movement is now 0 instead of 1
  - Changed drocap styling
  - Changed table caption header size
  - Improved regex for damage (by @bithir)

- Localization
  - Updated ES translation (by Tarot)

## Version 1.9.0

- Database upgrade

  - Updated database from v10 to v11. This means that Foundry v10 is no longer supported.

- New Item type: Injury.

  - Injuries can have temporary effects, see Active Effects below,
  - If the healing time is a dice formula, it can be rolled from the character sheet.
  - The healing time can be reduced/increased by left/right clicking.
  - When resting or passing a shift of time, the player will be asked if any un-healed inuries should have their healing time reduced.
  - When the healing time is reduced to zero, the player will be asked if the Injury should be removed.

- Active Effects

  - Active effects can be created directly on Actors or on the following Item sub-types: Ability, Armor, Helmet, Injury, Item and Weapon.
  - Active effects can be used to modify attributes and derived ratings.
  - Active effects can be set to only affect the character when the item that has the effect is equipped.

- Character, NPC and Monster sheets

  - Added tab for Effects (& Injuries).
  - Values directly affected by an active effect are shown in a highlighted color and get a tooltip with the original value.
  - Magic tricks are now listed separately from spells.

- Journals

  - Magic tricks are now listed separately from spells in NPC descriptions.
  - NPCs and Monsters can now have special formatting on their name in order to distinguish named NPCs and monsters.

- Bug fixes

  - Fixed bug that death roll failed when closing the roll dialog.
  - Fix for error when monster attack description is missing &lt;b&gt; tag.
  - Monster attacks now respect the roll mode.
  - Changed label from "Find weak point" to "Find weak spot".
  - Added speaker to some chat messages.

- Miscellaneous

  - Showing the checkbox for equipping all Items is now default true.
  - Automatic token size based on monster size.
  - Support for abilities on hotbar.

- Localization

  - Updated ES translation (by Tarot)

- For developers
  - The system now uses datamodels instead of template.json (contribution by @xdy).
  - Hot reload is now supported (contribution by @xdy).
  - Added data to give AA access to ability uses (contribution from @rayners)
  - maxEncumbrance was moved from the actor sheet to the actor.

## Version 1.8.3

- Characters Sheet / Settings

  - Added option to disable automatic improvement checkmarks on Dragon and Demon rolls (by @xdy).

- Localization

  - Updated ES translation (by Tarot).
  - Updated PT-BR translation (by Roberto Pedroso).

- Foundry v12 compatibility

  - Fix for incorrect default age when creating a character in v12.
  - Fixed a number of deprecation warnings.

- Miscellaneous (for developers)
  - Added eslint to vscode project.
  - Fixed lint warnings (contributions by @xdy).
  - Updated gulp to 5.0.0 (by @xdy).
  - Added documentation of DoDTest option parameters.

## Version 1.8.2

- Combat
  - Players can no longer use the selection method for dealing damage. This was a source of confusion and frequently made players deal damage to their own characters.
  - Setting to allow GMs to use the selection method for dealing damage.
- NPC & Monster sheets
  - Look for Backspace key as well as Delete. This will allow Mac users to use the Delete key without modifiers when deleting items from the main tab of the NPC and Monster sheets. (by @rayners)
- Bug fixes
  - Fix for weapon tests not working if a token on the scene is missing its actor.
  - Fix for floating point precision when calculating encumbrance.
  - Minor visual fixes
- Localization
  - Updated FR localization. (by @Harfang)
- Miscellaneous
  - A few minor improvements for module and macro creators (see github for details)

## Version 1.8.1

- Monsters & Characters
  - Fix for Monster size and Character age being incorrect when importing them for the first time.
  - NOTE! If you already imported the Bestiary, you must re-import it to get the correct size on Monsters.
- Localization
  - Updated ES localization (by Tarot).

## Version 1.8.0

- Monsters
  - Select Monster Attack. The default behavior when clicking the Monster Attack button is to open a dialog where you can choose to make a specific attack or a random attack. Skip the dialog and make a random attack by holding SHIFT or CTRL while clicking the button. The default behavior can be reversed in Game Settings.
- Characters
  - Training skills
    - Added dialog box when marking a skill for improvement when the intent probably was to train the skill.
    - Changed labels and added tooltips on character sheet.
  - Setting for using world skills for new characters.
  - Removed HP/WP roll on shift rest (by @rayners).
  - DSN die when resting a round is now always green.
- NPCs
  - Added Encumbrance to NPCs.
- Items
  - Added Enchanted weapon feature.
- Macros
  - Added macros for attribute tests. The macros also work for NPCs & Monsters.
- Journal
  - Fixed spelling errors in Introduction journal.
  - Adjusted bottom margin on info box.
- Localization
  - Updated german localization (by @KaiderWeise).
  - Added french localization (by @Harfang).
- Miscellaneous
  - Prevent double-clicks when clicking on buttons in chat messages.
  - Warning when deleting actor that has tokens on scenes.
  - Graceful handling of damage application on token without actor.
  - Replaced .data with .system in handlebars.

## Version 1.7.1

- Journals
  - Show WP on NPCs in Journals, even if they don't have spells or abilities.
  - Minor layout change for NPCs in Journals.
- Localization
  - Updated ES (by Tarot)
  - Changed from "zh-TW" to "zh-tw" in order to match with Foundry's localization.
- Miscellaneous
  - Changed warning for missing table link to a log message in order to avoid spammin warning messages. This could happen if the upcoming Bestiary is imported without the Core module, for example.

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
