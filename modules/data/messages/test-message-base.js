import DoDChatMessageBaseData from "./message-base.js";
import DoD_Utility from "../../utility.js";

export default class DoDTestMessageBaseData extends DoDChatMessageBaseData {
    static TYPE = "";
    static TEMPLATE = "";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            actorUuid: new fields.StringField({ required: true, initial: "" }),
            banes: new fields.NumberField({ required: true, initial: 0 }),
            boons: new fields.NumberField({ required: true, initial: 0 }),
            canPush: new fields.BooleanField({ required: true, initial: false }),
            formulaInfo: new fields.StringField({ required: false, initial: "" }),
            isDemon: new fields.BooleanField({ required: true, initial: false }),
            isDragon: new fields.BooleanField({ required: true, initial: false }),
            result: new fields.NumberField({ required: true, initial: 0 }),
            success: new fields.BooleanField({ required: true, initial: false }),
            target: new fields.NumberField({ required: true, initial: 0 }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace actorUuid with actor
        context.actor = fromUuidSync(this.actorUuid);
        delete context.actorUuid; // remove actorUuid from context
        return context;
    }

    static prepareSource(context) {
         // replace actor with actorUuid
        const { actor, ...rest } = super.prepareSource(context);
        return { ...rest, actorUuid: actor.uuid };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollResult() {
        if (this.isDragon) {
            return game.i18n.localize("DoD.roll.dragon");
        } else if (this.isDemon) {
            return game.i18n.localize("DoD.roll.demon");
        } else if (this.success) {
            return game.i18n.localize("DoD.roll.success");
        } else {
            return game.i18n.localize("DoD.roll.failure");
        }

    }

    async getTooltip(roll) {
        return await roll.getTooltip();
    }

    async renderRoll(roll) {
        if ( !roll._evaluated ) await roll.evaluate({});

        const defaultContext = {
            formula: roll.formula,
            user: game.user.id,
            total: Math.round(roll.total * 100) / 100,
        };

        const renderContext = {...defaultContext, ...await this.toContext(), rollType: this.type};
        if (renderContext.formulaInfo) {
            renderContext.tooltip = renderContext.formulaInfo + await this.getTooltip(roll);
        } else {
            renderContext.tooltip = await this.getTooltip(roll);
        }

        return await DoD_Utility.renderTemplate(this.template, renderContext);
    }

    async createMessageData(roll) {
        const messageData = this.formatRollMessage();
        if (this.template) {
            if (!messageData.content) { messageData.content = ""; }
            messageData.content += await this.renderRoll(roll);
        }
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: fromUuidSync(this.actorUuid) }),
            ...messageData,
            type: this.type,
            system: this.toObject()
        }
    }

    async toMessage(roll) {
        const messageData = await this.createMessageData(roll);
        const msg = await roll.toMessage(messageData);
        console.log(msg)
    }

    async onCritical(_message) {
        // To be implemented in subclass if needed
    }
            
}
