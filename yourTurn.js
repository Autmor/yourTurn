
export default class TurnSubscriber{
    
    static gmColor; 
    static myTimer;
    static lastCombatant;

    static imgCount = 1;
    static currentImgID = null;
    static nextImgID; 

    static expectedNext;


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
        if(!(update["turn"] || update["round"])){return;}

        console.log(update);

        if(!combat.started){return;}

        if(combat.combatant == this.lastCombatant){return;}

        this.lastCombatant = combat.combatant;



        this.image = combat?.combatant.actor.img;

        var ytName = combat?.combatant.name;
        var ytText = "";
        var ytImgClass = new Array();
        ytImgClass.push("adding");

        if (game.modules.get('combat-utility-belt')?.active) {
            if(game.cub.hideNames.shouldReplaceName(combat?.combatant?.actor))
            {
                ytName = game.cub.hideNames.getReplacementName(combat?.combatant?.actor)
            }            
          }


        if(combat?.combatant?.isOwner && !game.user.isGM && combat?.combatant?.players[0]?.active)
        {
            ytText = `${game.i18n.localize('YOUR-TURN.YourTurn')}, ${ytName}!`;
        }
        else if(combat?.combatant?.hidden && !game.user.isGM)
        {   
            ytText = `${game.i18n.localize('YOUR-TURN.SomethingHappens')}`
            ytImgClass.push("silhoutte");
        }
        else
        {
            ytText = `${ytName}'s ${game.i18n.localize('YOUR-TURN.Turn')}!`;
        }

        let nextCombatant = this.getNextCombatant(combat);
        let expectedNext = combat?.nextCombatant;

        var container =  document.getElementById("yourTurnContainer");
        if(container == null)
        {
            let containerDiv = document.createElement("div");
            let uiTOP = document.getElementById("ui-top");
            containerDiv.id = "yourTurnContainer";



            uiTOP.appendChild(containerDiv);

            console.log("Appended Container");
            console.log(uiTOP.childNodes);

            container = document.getElementById("yourTurnContainer");
        }

        
        this.checkAndDelete(this.currentImgID);
        this.checkAndDelete("yourTurnBanner");

        var nextImg = document.getElementById(this.nextImgID);



        if(nextImg != null){
            if(combat?.combatant != this.expectedNext)
            {
            nextImg.remove();
            this.currentImgID = null;
            }
            else{
                this.currentImgID = this.nextImgID;
            }           
        }

        this.imgCount = this.imgCount + 1;
        this.nextImgID = `yourTurnImg${this.imgCount}`;

        let imgHTML = document.createElement("img");
        imgHTML.id = this.nextImgID;
        imgHTML.className = "yourTurnImg";
        imgHTML.src = expectedNext?.actor.img;
        
        if(this.currentImgID == null)
        {           
            this.currentImgID = `yourTurnImg${this.imgCount - 1}`;

            let currentImgHTML = document.createElement("img");
            currentImgHTML.id = this.currentImgID;
            currentImgHTML.className = "yourTurnImg";
            currentImgHTML.src = this.image;
            
            container.append(currentImgHTML)
            console.log(imgHTML);
        }

        let bannerDiv = document.createElement("div");
        bannerDiv.id = "yourTurnBanner";
        bannerDiv.className = "yourTurnBanner";
        bannerDiv.style.height = 150;
        bannerDiv.innerHTML = `<p id="yourTurnText" class="yourTurnText">${ytText}</p><div class="yourTurnSubheading">${game.i18n.localize('YOUR-TURN.Round')} #${combat.round} ${game.i18n.localize('YOUR-TURN.Turn')} #${combat.turn}</div>${this.getNextTurnHtml(nextCombatant)}<div id="yourTurnBannerBackground" class="yourTurnBannerBackground" height="150"></div>`;
        
        


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

        let currentImgHTML = document.getElementById(this.currentImgID);
        while(ytImgClass.length > 0){
            currentImgHTML.classList.add(ytImgClass.pop());
        }

        container.append(imgHTML);
        container.append(bannerDiv);



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
        clearInterval(this.myTimer);
        var element = document.getElementById("yourTurnBannerBackground");
        element.classList.add("removing");

        element = document.getElementById("yourTurnBanner");
        element.classList.add("removing");
        
        element = document.getElementById(this.currentImgID);
        element.classList.add("removing");
    }

    static getNextCombatant(combat)
    {
        let j = 1;
        let combatant = combat?.turns[(combat.turn + j) % combat.turns.length];

        while(combatant.hidden && (j < combat.turns.length) && !game.user.isGM)
        {
            j++;
            combatant = combat?.turns[(combat.turn + j) % combat.turns.length];
        }

        return combatant;
    }

    static getNextTurnHtml(combatant)
    {
        let displayNext = true;

        let name = combatant.name;
        let imgClass = "yourTurnImg yourTurnSubheading";
        
        if (game.modules.get('combat-utility-belt')?.active) 
        {
            if(game.cub.hideNames.shouldReplaceName(combatant?.actor))
            {
                name = game.cub.hideNames.getReplacementName(combatant?.actor)
                imgClass = imgClass + " silhoutte";
            }        
        }

        //displayNext = (j != combat.turns.length);

        if(displayNext)
        {
            let rv = `<div class="yourTurnSubheading last">${game.i18n.localize('YOUR-TURN.NextUp')}:  <img class="${imgClass}" src="${combatant.actor.img}"></img>${name}</div>`;
            console.log(rv);
            return rv;
        }
        else
        {
            return  null;
        }

    }

    static checkAndDelete(elementID){
        
        var prevImg = document.getElementById(elementID);
        if(prevImg != null){
            prevImg.remove();
        }
    }

    
}
TurnSubscriber.begin();