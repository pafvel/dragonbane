

export default class SocketHandler{
    constructor() {
        this.identifier = "system.dragonbane" 
        this.registerSocketEvents()
    }
    registerSocketEvents() {

        game.socket.on(this.identifier, async (data) => {
            switch(data.type){
                case "dropItemtoAnotherCharacter":
                    const item = await fromUuid(data.data.uuid);
                    const targetActor = data.data.closestToken.actor;
                    const user = game.user._id;
                    if(targetActor.ownership[user] === 3 && !game.user.isGM){
                        if(item.system.quantity > 1){
                            const newItem = await item.clone();;
                            await newItem.update({['system.quantity']: 1})
                            await targetActor.createEmbeddedDocuments("Item", newItem)
                        }
                        else{
                            await targetActor.createEmbeddedDocuments("Item", item)
                        }
                        return
                    }
                    else if(game.user.isGM){
                        if(item.system.quantity > 1){
                            const newItem = await item.clone();
                            await newItem.update({['system.quantity']: 1})
                            await targetActor.createEmbeddedDocuments("Item", newItem)
                        }
                        else{
                            await targetActor.createEmbeddedDocuments("Item", item)
                        }
                        return
                    }
            }
            
        })
    }

}
    