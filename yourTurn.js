
export default class TurnSubscriber{
    
    static gmColor; 
    static myTimer;

    static begin(){
        Hooks.on("ready",()=> 
        {
            const firstGm = game.users.find((u) => u.isGM && u.active);
            this.gmColor = firstGm["color"];
            Hooks.on("updateCombat", (combat, update, options, userId) => {
                TurnSubscriber._onUpdateCombat(combat, update, options, userId);
            });
            //game.yourturnHUD = new YourTurnHUD();
        });
    }

    static _onUpdateCombat(combat, update, options, userId) {       
        if(!update["turn"] && !update["round"]){return;}

        this.image = combat?.combatant.actor.img;

        var ytText = "";
        var ytImgClass = `class="yourTurnImg"`;

        if(combat?.combatant?.isOwner && !game.user.isGM && combat?.combatant?.players[0]?.active)
        {
            ytText = `It's your Turn, ${combat?.combatant.name}!`;
        }
        else if(combat?.combatant?.hidden && !game.user.isGM)
        {   
            ytText = `Something is happening....`
            ytImgClass = `class="yourTurnImg silhoutte"`;
        }
        else
        {
            ytText = `${combat?.combatant.name}'s Turn!`;
        }

        let html =         
        `
        <div id="yourTurnContainer" class="yourTurnContainer">
        <img id="yourTurnImg" ${ytImgClass} src="${this.image}"></img>
        <div id="yourTurnBanner" class="yourTurnBanner" height="150">
        <p id="yourTurnText" class="yourTurnText">${ytText}<p>
        <div class="yourTurnSubheading">Round #${combat.round} Turn #${combat.turn}</div>${this.getNextTurnHtml(combat)}
        </div>
        <div id="yourTurnBannerBackground" class="yourTurnBannerBackground" height="150"></div>
        </div>
        </div>
        `;


        var r = document.querySelector(':root');
        if(combat?.combatant?.hasPlayerOwner && combat?.combatant?.players[0].active){
            const ytPlayerColor = combat?.combatant?.players[0]["color"];      
            r.style.setProperty('--yourTurnPlayerColor', ytPlayerColor);
            r.style.setProperty('--yourTurnPlayerColorTransparent', ytPlayerColor + "80");
        }
        else{
            r.style.setProperty('--yourTurnPlayerColor', this.gmColor);
            r.style.setProperty('--yourTurnPlayerColorTransparent', this.gmColor + "80");
        }

        if ($("#ui-top").find(`div[id="yourTurnContainer"]`).length > 0){
            $("#ui-top").find(`div[id="yourTurnContainer"]`).remove();
        } 

        $("#ui-top").append(html);

        clearInterval(this?.myTimer);
        this.myTimer = setInterval(() => {
            this.unloadImage()
        }, 5000);
    }

    static loadNextImage(combat){
        //Put next turns image in a hidden side banner
        let nextTurn = combat.turn + 1;

        let hiddenImgHTML = `<div id="yourTurnPreload"><img id="yourTurnPreloadImg" src=${combat?.turns[(combat.turn + 1) % combat.turns.length].actor.img} loading="eager" width="800" height="800" ></img><div>`

        if ($("body").find(`div[id="yourTurnPreload"]`).length > 0){
            $("body").find(`div[id="yourTurnPreload"]`).remove();
        }

        $("body").append(hiddenImgHTML);
    }

    static unloadImage()
    {
        var element = document.getElementById("yourTurnBannerBackground");
        element.classList.add("removing");

        element = document.getElementById("yourTurnBanner");
        element.classList.add("removing");
        
        element = document.getElementById("yourTurnImg");
        element.classList.add("removing");
        clearInterval(this.myTimer);
    }

    static getNextTurnHtml(combat)
    {
        let j = 1;
        let combatant = combat?.turns[(combat.turn + j) % combat.turns.length];
        let displayNext = true;

        while(combatant.hidden && (j < combat.turns.length) && !game.user.isGM)
        {
            j++;
            combatant = combat?.turns[(combat.turn + j) % combat.turns.length];
        }

        displayNext = (j != combat.turns.length);

        if(displayNext)
        {
            return `<div class="yourTurnSubheading last">Next Up :  <img class="yourTurnImg yourTurnSubheading" src=${combatant.actor.img}></img> ${combatant.name}</div>`;
        }
        else
        {
            return  ``;
        }

    }

    
}
TurnSubscriber.begin();