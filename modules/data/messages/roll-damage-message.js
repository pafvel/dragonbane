import DoDChatMessageBaseData from "./message-base.js";
import DoD_Utility from "../../utility.js";

export default class DoDRollDamageMessageData extends DoDChatMessageBaseData {
    static TYPE = "rollDamage";
    static TEMPLATE = "systems/dragonbane/templates/partials/damage-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            actorUuid: new fields.StringField({ required: true, initial: "" }),
            weaponUuid: new fields.StringField({ required: false, initial: "" }),
            targetActorUuid: new fields.StringField({ required: true, initial: "" }),
            damage: new fields.NumberField({ required: true, initial: 0 }),
            damageType: new fields.StringField({ required: true, initial: "" }),
            formula: new fields.StringField({ required: false, initial: "" }),
            isHealing: new fields.BooleanField({ required: true, initial: false }),
            ignoreArmor: new fields.BooleanField({ required: true, initial: false }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace actorUuid with actor
        context.actor = fromUuidSync(this.actorUuid);
        delete context.actorUuid;

        // replace weaponUuid with weapon
        context.weapon = this.weaponUuid ? fromUuidSync(this.weaponUuid) : null;
        delete context.weaponUuid;

        // replace targetActorUuid with target
        context.targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : null;
        delete context.targetActorUuid;

        return context;
    }

    static prepareSource(context) {
         // replace actor with actorUuid
        const { actor, targetActor, weapon, ...rest } = super.prepareSource(context);
        return { ...rest, actorUuid: actor?.uuid, weaponUuid: weapon?.uuid, targetActorUuid: targetActor?.uuid };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    async createMessageData(roll) {
        const context = this.toContext();

        const weaponName = context.weapon ? (context.weapon?.isToken ? context.weapon.token.name : context.weapon?.name) : "";
        const targetName = context.targetActor ? (context.targetActor?.isToken ? context.targetActor.token.name : context.targetActor?.name) : "";;
        const damageTotal = Math.round(this.damage);

        let msg = context.isHealing ?
            "DoD.roll.healing" :
            (weaponName ? (context.ignoreArmor ? "DoD.roll.damageIgnoreArmor" : "DoD.roll.damageWeapon") : "DoD.roll.damage");

        if (context.targetActor) {
            msg += "Target";
        }

        const content = game.i18n.format(game.i18n.localize(msg), {
            actor: ChatMessage.getSpeaker({ actor: context.actor }).alias,
            damage: damageTotal,
            damageType: game.i18n.localize(context.damageType),
            weapon: weaponName,
            target: targetName
        });

        const templateContext = {
            user: game.user.id,
            formula: context.formula,
            tooltip: await roll.getTooltip(),
            total: damageTotal,
            damageType: context.damageType,
            ignoreArmor: context.ignoreArmor,
            target: context.targetActor,
            isHealing: context.isHealing
        };
        const renderedTemplate = await DoD_Utility.renderTemplate(this.template, templateContext);

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: context.actor }),
            content: "<p>" + content + "</p>" + renderedTemplate,
            type: this.type,
            system: this.toObject()
        };
    }

    async toMessage(roll) {
        const messageData = await this.createMessageData(roll);
        const msg = await roll.toMessage(messageData);
        return msg;
    }    
}

Hooks.once("init", () => {
  DoDRollDamageMessageData.register();
});