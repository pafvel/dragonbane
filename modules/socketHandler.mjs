export default class SocketHandler{
    constructor() {
        this.identifier = "system.dragonbane" 
        this.registerSocketEvents()
    }
    registerSocketEvents() {

        game.socket.on(this.identifier, async (data) => {
            switch(data.type){
                case "dropItemtoAnotherCharacter":
                const dataHook = data.data;
                const dropX = dataHook.x;
                const dropY = dataHook.y;
                const dropPoint = { x: dropX, y: dropY };
                const tokens = game.canvas.tokens.placeables;
                function distance(a, b) {
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    return Math.sqrt(dx * dx + dy * dy);
                }
                let closestToken = null;
                let minDistance = Infinity;

                for (const token of tokens) {
                    const center = token.center;
                    const dist = distance(center, dropPoint);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestToken = token;
                    }
                }
                if (closestToken) {
                    console.log(`Closest token to drop point is: ${closestToken.name}`);

                } else {
                    console.log("No tokens found on the canvas.");
                }

            }
            
        })
    }

}
    