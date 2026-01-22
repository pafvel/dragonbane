import DragonbaneDataModel from "../DragonbaneDataModel.js";

export default class DoDChatMessageBaseData extends DragonbaneDataModel {
    
    static TYPE = null;     // Override in subclasses, e.g. "damage", "healing", etc.
    static TEMPLATE = null; // Override in subclasses, e.g. "systems/dragonbane/templates/partials/damage-message.hbs"

    static get type() { return this.TYPE; }
    get type() { return this.constructor.type; }

    static get template() { return this.TEMPLATE; }
    get template() { return this.constructor.template; }

    static register() {
        // Map subtype to this data model
        CONFIG.ChatMessage.dataModels[this.type] = this;

        // Register context menu options
        const actions = this.actions();
        if (actions.length > 0) {
            Hooks.on("getChatMessageContextOptions", (_html, options) => {
                options.unshift(...actions);
            });
        }
        return this;
    }

    //static actions() { return []; }

    static actions() {
        return [
            {
                // Register context menu action for all types with targetActorUuid field
                // Requires createMessageData(roll) to be implemented in subclass
                // Maybe this could be made more elegant later
                name: "DoD.ui.chat.updateTarget",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: (el) => {
                    // Check if the message type matches
                    const message = this.messageFromElement(el);
                    if (message?.type !== this.TYPE) {
                        return false;
                    }
                    // Check if this message has a targetUuid to update
                    if (!("targetActorUuid" in message.system.schema.fields)) {
                        return false;
                    }
                    // Check if the target is different
                    const targets = Array.from(game.user.targets);
                    const targetActorUuid = targets.length > 0 ? targets[0].actor.uuid : "";
                    if (targetActorUuid === message.system.targetActorUuid) {
                        return false;
                    }
                    return true;
                },
                callback: async (el) => {
                    const message = this.messageFromElement(el);
                    if (!message) return;

                    // Choose the new target (first targeted token)
                    const targets = Array.from(game.user.targets);
                    const targetActorUuid = targets.length > 0 ? targets[0].actor.uuid : "";

                    // Update message data
                    const systemData = { ...message.system.toObject(), targetActorUuid };
                    const model = new message.system.constructor(systemData);
                    const messageData = await model.createMessageData(message.rolls[0]);

                    // Persist the update
                    await message.update(messageData);
                }
            }
        ];
    }

    toContext() {
        return this.toObject();
    }

    static prepareSource(context) {
        return context;
    }

    static messageFromElement(el) {
        const messageId = el.closest(".chat-message")?.dataset.messageId;
        return game.messages.get(messageId);
    }
}
