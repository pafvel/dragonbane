import DoDActorBaseSheet from "./actor-base-sheet.js";
import DoD_Utility from "../utility.js";
import DoDSkillTest from "../tests/skill-test.js";

export default class DoDMonsterSheet extends DoDActorBaseSheet {

    static DEFAULT_OPTIONS =  {
        classes: ["DoD", "sheet", "character"],
        position: { width: 580, height: 670 },
        window: { resizable: true, title: 'DoD.NpcSheetTitle' },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
          actions: {  
        }
    };

    static TABS = {
        primary: {
            tabs: [
            { id: 'main', group: 'primary', label: 'DoD.ui.character-sheet.main' },
            { id: 'skills', group: 'primary', label: 'DoD.ui.character-sheet.skills' },
            { id: 'inventory', group: 'primary', label: 'DoD.ui.character-sheet.inventory' },
            { id: 'effects', group: 'primary', label: 'DoD.ui.character-sheet.effects' },
            ],
            initial: 'main'
        }
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/monster-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/npc-sheet-tabs.hbs`},
        main: { scrollable: [''], template: 'systems/dragonbane/templates/parts/monster-sheet-main.hbs' },
        skills: { scrollable: [''], template: 'systems/dragonbane/templates/parts/npc-sheet-skills.hbs' },
        inventory: { scrollable: [''], template: 'systems/dragonbane/templates/parts/npc-sheet-inventory.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-effects.hbs' },
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.traitsHTML = await this.enrich(context.system.traits);

        return context;        
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        const html = $(this.element);

        if (this.actor.isOwner) {
            html.find(".monster-attack").on("click contextmenu", this._onMonsterAttack.bind(this));
            html.find(".monster-defend").on("click", this._onMonsterDefend.bind(this));
        }
    }

    #processSelectMonsterAttack(form, table) {
        let elements = form.getElementsByClassName("selectMonsterAttack");
        let element = elements.length > 0 ? elements[0] : null;
        if (element) {
            const value = parseInt(element.value);
            if (value > 0) {
                for (let tableResult of table.results) {
                    if (value === tableResult.range[0]) {
                        DoD_Utility.monsterAttack(this.actor, table, tableResult);
                        return;
                    }
                }
            } else {
                DoD_Utility.monsterAttack(this.actor, table);
            }
        }
    }

    async _onMonsterAttack(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        const table = this.actor.system.attackTable ? fromUuidSync(this.actor.system.attackTable) : null;
        if (!table) {
            DoD_Utility.WARNING("DoD.WARNING.missingMonsterAttackTable");
            return;
        }

        if (event.type === "click") { // left click
            let skipDialog = event.shiftKey || event.ctrlKey;
            if (!game.settings.get("dragonbane", "monsterAttackDialogIsDefault")) {
                skipDialog = !skipDialog;
            }
            if (skipDialog) {
                return DoD_Utility.monsterAttack(this.actor, table);
            }
            let dialogData = { };
            dialogData.attacks = [];
            for (let result of table.results) {
                // Find attack description
                let attack = {name: "", description: "", index: result.range[0]};
                
                let documentType = DoD_Utility.getTableResultType(result);

                if (documentType === "RollTable") {
                    let subTable = DoD_Utility.findTable(game.release.generation < 13 ? result.text : result.name);
                    if (subTable?.uuid !== table.uuid) {
                        attack.description = subTable?.description;
                    } else {
                        attack.description = game.release.generation < 13 ? result.text : result.description;
                    }
                } else {
                    attack.description = game.release.generation < 13 ? result.text : result.description;
                }
                attack.description = await CONFIG.DoD.TextEditor.enrichHTML(attack.description, { async: true });

                // Split attack name and description
                const match = attack.description.match(/<(b|strong)>(.*?)<\/\1>(.*)/);
                if (match) {
                    attack.name = match[2];
                    attack.description = match[3]
                } else {
                    attack.name = String(attack.index);
                }
                dialogData.attacks.push(attack);
            }

            const template = "systems/dragonbane/templates/partials/monster-attack-dialog.hbs";
            const html = await DoD_Utility.renderTemplate(template, dialogData);
            const labelOk = game.i18n.localize("DoD.ui.dialog.labelOk");
            const labelCancel = game.i18n.localize("DoD.ui.dialog.labelCancel");

            return await new Promise(
                resolve => {
                    const data = {
                        item: this.item,
                        title: game.i18n.localize("DoD.ui.dialog.monsterAttackTitle"),
                        content: html,
                        buttons: {
                            ok: {
                                label: labelOk,
                                callback: html => resolve(this.#processSelectMonsterAttack(html[0].querySelector("form"), table))
                                //callback: html => resolve({cancelled: false})
                            },
                            cancel: {
                                label: labelCancel,
                                callback: _html => resolve({cancelled: true})
                            }
                        },
                        default: "ok",
                        close: () => resolve({cancelled: true})
                    };
                    new Dialog(data, null).render(true);
                }
            );
        } else { // right click
            return DoD_Utility.monsterAttackTable(this.actor, table);
        }
    }

    async _onMonsterDefend(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        // Monsters always dodge or parry with skill value 15
        const skill = {
            name: game.i18n.localize("DoD.ui.character-sheet.monsterDefendSkillFlavor"),
            system: {value: 15}
        }

        const test = new DoDSkillTest(this.actor, skill, {skipDialog: true});
        await test.roll();
    }    
}