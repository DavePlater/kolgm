// ==UserScript==
// @name           Plater's AutoAdventure Again
// @namespace      http://kol.coldfront.net/thekolwiki/index.php/User:Plater
// @description    (Ver 3.2) Attempts to autocontinue after each combat adventure AND choice adventure (gives limited choice adventure descriptions)
// @include        http://*kingdomofloathing.com/fight.php*
// @include        http://*kingdomofloathing.com/charpane.php*
// @include        http://*kingdomofloathing.com/account.php*
// @include        http://*kingdomofloathing.com/topmenu.php*
// @include        http://*kingdomofloathing.com/choice.php*
// @include        http://*.kingdomofloathing.com/mining.php*
// @include        http://127.0.0.1:*/fight.php*
// @include        http://127.0.0.1:*/charpane.php*
// @include        http://127.0.0.1:*/account.php*
// @include        http://127.0.0.1:*/topmenu.php*
// @include        http://127.0.0.1:*/choice.php*
// @include        http://*.kingdomofloathing.com/tiles.php*
// @include				 http://*.kingdomofloathing.com/clan_viplounge.php*
// @include				 http://127.0.0.1:*/clan_viplounge.php*

// @require				 http://images.kingdomofloathing.com/scripts/jquery-1.3.1.min.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// @grant				GM_xmlhttpRequest
// @grant				unsafeWindow
//
// @copyright 2009+, Plater (http://www.platertopia.com/) 
// ==/UserScript==

//
// Version 0.1	02/20/2009	Beta(date unsure)
// Version 1.0	12/20/2010	First public release!
// Version 1.1	12/23/2010	With combat macros being badass, I have removed the auto-attack portion
//															This makes the script name kind of a mis-nomer.
//															Switched the way turn count is saved, uses enter key and html not alert()
// Version 2.0	02/04/2011	Moved the location of charpane item up towards top and trimmed up
//															Fixed account menu items to match new scheme(sort of) => generates an exception in the jQuery object used by kol
// Version 2.1	02/04/2011	Fixed the exception by giving LI an id, but then CDM returns the "you managed to click a nonexistant tab go you!"
//															So set a interval to check for his fail result and load my data. In future, may drop JQuery
// Version 2.2	09/28/2011	No idea what all has happened in the last few months, but I've stubbed a bunch of stuff in.
//															Changed the name of the script to better reflect what it currently does
// Version 2.3	02/02/2012	Trying to fix the save format to utf8(gChrome complains??) and also started adding in some descriptive text for choice adventures
// Version 3.0  12/09/2014  Added a whole smattering of random things 
//															*Auto trick or treat 
//															*More choice adventure rewards 
//															*Screwed with the size of the text in charpane
//															*Circled the B-A-N-A-N-S tiles in the hidden temple (cheaply)
//															*Used jquery to and get the CharacterName and TurnsLeft (hopefully supports different charpane options)
// Version 3.1  12/10/2014  Simple mining helper(red box the sparkles)
// Version 3.2	02/04/2015	BREAKFAST! Clicking back wall in VIP lounge now triggers some tasks

//	TODO: Make the choice adventure thing be its own script (or scrap it for the one already in the GM list for kol)
//	TODO: Make the wait-timeouts settable
//	TODO: Fix that obnoxious way I create my options page. I should be able to string-ify most of that instead of using the DOM

//http://wiki.greasespot.net/@grant
/*This code will save a jQuery reference (into this the script's global scope when running in the grant none mode), while removing it from window (the content global scope) and restoring anything originally stored there. */
this.$ = this.jQuery = jQuery.noConflict(true);

/*
Mer-kin healer
07/30/2014 Mer-kin burglar

Parse:
http://www.kingdomofloathing.com/fight.php?*

Look for:
<tbody><tr><td><img src="http://images.kingdomofloathing.com/itemimages/simplekey.gif" alt="Mer-kin lockkey" title="Mer-kin lockkey" class="hand" onclick="descitem(530410791)"></td><td class="effect" valign="center">You acquire an item: <b>Mer-kin lockkey</b></td></tr></tbody>

	You acquire an item: Mer-kin lockkey

And xp="//span[@id='monname']" monster name
*/

//YNRD
// /html/body/center[2]/table[1]
var basekeyname="autocombat_";
var prekeyname="";
var BadCharName="(Unknown)";
var BadTurnsCount=-1;
var tname="plater_div_name";
var accountpagebaseid="plater_autocombat";
var DefaultScriptIcon="http://images.kingdomofloathing.com/itemimages/minimoon2.gif";//"https://addons.cdn.mozilla.net/img/uploads/addon_icons/0/748-64.png";//"http://youngpup.net/z_dropbox/greasespot_favicon.ico";

//These things should become user settable?
var TimeToWaitToProccess=750;//Time to wait before doing fight.php stuff
var TimeToWaitAttack=1000;//time to wait before "pressing" attack button
var TimeToWaitAdventureAgain=1000;//time to wait before "clicking" adventure again
var OkToShrinkCharpaneText=true;
var OkToShrinkCharpaneImages=true;

//When people go to steal the acount/options page thing they'll need this: (being egotistical about it happening)02/07/2011
var ScriptIcon="https://addons.cdn.mozilla.net/img/uploads/addon_icons/0/748-64.png";//"http://youngpup.net/z_dropbox/greasespot_favicon.ico";
//And this func: function InsertTableIntoAccountInterface(tabID,tabTitleString, tabInnerObj)
//And this func: function LoadOurOptionsTab(tabID,tabTitleString,tabInnerObj)


///Fluctuations
var charName=BadCharName;
var charTurns=BadTurnsCount;
var charFindTime=0;

//Notes from GM website
//To simulate a "click" on object el that used AddEventListener()
//		var evt = document.createEvent("HTMLEvents");
//		evt.initEvent("click", true, true);
//		el.dispatchEvent(evt);
//
// Assume "a" contains a reference to an <a> you want to "click"
//		location.assign( "javascript:" + a.getAttribute("onclick") + ";void(0)" );
// To use the href="javascript:" type links:
//		location.assign( a.getAttribute('href') );


/**
 * ReplaceAll by Fagner Brack (MIT Licensed)
 * Replaces all occurrences of a substring in a string
 */
String.prototype.replaceAll = function( token, newToken, ignoreCase ) 
{
  var _token;
  var str = this + "";
  var i = -1;

  if ( typeof token === "string" ) //why is there no check if newToken is a string?
  {
      if ( ignoreCase ) 
      {
          _token = token.toLowerCase();
          while( (i = str.toLowerCase().indexOf(token, i >= 0 ? i + newToken.length : 0) ) !== -1){	str = str.substring(0, i) + newToken + str.substring(i + token.length);	}
      } 
      else {	return this.split( token ).join( newToken );	}
  }
	return str;
};

if(!String.prototype.trim) {  String.prototype.trim = function () {    return this.replace(/^\s+|\s+$/g,'');  };}
if(!String.prototype.trim) {	String.prototype.endsWith = function(suffix) {	    return this.indexOf(suffix, this.length - suffix.length) !== -1;	};}


// ************************* //
// *** BREAKFAST RELATED *** //
// ************************* //

var intMaxNumBreakfastChecks=10;
var intBreakfastCheckInterval=1500;
var tmBreakfastCheck;
var intCallsSent=0;
var aryCallsCompleted=[];
var aryBreakfastResults=[];
var intBreakfastChecks=0;
//var TempToIndex=["", "Cold", "Cool", "Lukewarm", "Warm","Hot"];
var intWhatTemp=1;//"Cold"

function ShowTheObject(response,WhichEvent)
{	//console.log (WhichEvent+" fired! [Status="+(response.status||0)+" "+(response.statusText||"") +"], "+response.context);
	if(WhichEvent=="onload")
	{
		var el = $( '<div></div>' );
		el.html(response.response);		//console.log(el.innerHTML);
		var theTDs=$("center > table[cellspacing='0'] > tbody > tr > td", el);//The results of the action will be in the first two: /html/body/center/table/tbody/tr/td
		if(theTDs.length>=3)		{			aryBreakfastResults.push(theTDs[0].innerHTML+" "+(response.context||"")+"<br/>"+theTDs[1].innerHTML+theTDs[2].innerHTML);		}
		else{ console.log(theTDs); console.log (WhichEvent+" fired! [Status="+(response.status||0)+" "+(response.statusText||"") +"], "+response.context);}
		aryCallsCompleted.push(true);
	}
	else{ aryCallsCompleted.push(false);}
}

function tmBreakfastCheck_tick()
{
	intBreakfastChecks++;
	if(aryCallsCompleted.length>=intCallsSent)
	{
		clearInterval(tmBreakfastCheck);//console.log(aryBreakfastResults);
		var el = $( '<div></div>' );
		el.html(aryBreakfastResults.join("<br/>"));
		var oPlace=$("body > center > table > tbody > tr > td > center > table > tbody > tr > td");		//find: /html/body/center/table/tbody/tr/td/center/table/tbody/tr/td
		oPlace.prepend(el);//and insert el before
	}
	if(intBreakfastChecks >= intMaxNumBreakfastChecks )	{		clearInterval(tmBreakfastCheck);		console.log("["+this+"]Timedout: "+aryCallsCompleted.length+" / "+intCallsSent);	}
}
function fireGM(params)//strURL,strContext, oData)
{
	fireGMp(params[0],params[1],params[2]);
}
function fireGMp(strURL,strContext, oData)
{
	var details={ method: (oData!=undefined)?"POST":"GET", url: strURL, context: strContext, onabort: function (response) { ShowTheObject(response,"onabort"); }, onload: function (response) { ShowTheObject(response,"onload"); },    ontimeout:  function (response) { ShowTheObject(response,"ontimeout"); }	};
	if(oData!=undefined)	{		details["data"]=oData;  	details["headers"]={ "Content-Type": "application/x-www-form-urlencoded" };	}
	GM_xmlhttpRequest (details );
}
function GetPWDFromLounge()
{
	var retval="";
	var str =""+unsafeWindow.pop_ircm_contents; //this is the name of a function, might have to try harder to get it, unsafeWindow etc

	var matches = str.match("&pwd=(.*)\" ");
	var astr=""+matches.length+"\r\n";
	if (matches.length > 1) 
	{
		retval=matches[1]; 
	}
	return retval;
}
function DoBreakfast()
{
	var strPWD="11410b660d86d8007d1ee5e5ca5514ca";//TODO get PWD
	// Try GM_loading a page to get the password/salt outa it?
	strPWD=GetPWDFromLounge();
	console.log("Found pwd="+strPWD);
	//
	var strCampGarden=["campground.php?action=garden&pwd="+strPWD,"Campground Garden"];
	var strSkillClipart=["campground.php", "Skill ClipArt", "action=bookshelf&preaction=combinecliparts&clip1=07&clip2=07&clip3=04&pwd="+strPWD];
	var strBarrelShrone=["choice.php","Barrel Shrine", "whichchoice=1100&pwd="+strPWD+"&option=4"]; //chose the class-based buff? do you need the submit button in there?
	
	var aryCamp=[ //Do you want the clipart in here??
	];	
	if(strPWD!="")
	{
		aryCamp.push(strCampGarden); //seems like it works
		aryCamp.push(strSkillClipart);aryCamp.push(strSkillClipart);aryCamp.push(strSkillClipart); //seems like it works
		aryCamp.push(strBarrelShrone); //choice adventure fail
	}
	
	var aryChate=[
		["place.php?whichplace=chateau&action=chateau_desk1", "Chateau Mantegna Desk"]
	];
	var	aryRumpus=[
		["clan_rumpus.php?action=click&spot=9","Rumpus Dusty Corner"]
		,["clan_rumpus.php?action=click&spot=1","Rumpus Nail In Wall"]
		,["clan_rumpus.php?action=click&spot=4","Rumpus Empty Endtable"]
		// get meat buff
		// ballpitt
	];
	var aryVIP=[
		["http://www.kingdomofloathing.com/clan_viplounge.php","Take Shower","preaction=takeshower&temperature="+intWhatTemp+""],
		["clan_viplounge.php?action=lookingglass","Looking Glass"],
		["clan_viplounge.php?action=crimbotree","Crimbo Tree"],
		["clan_viplounge.php?action=klaw","Klaw Game"],["clan_viplounge.php?action=klaw","Klaw Game"],["clan_viplounge.php?action=klaw","Klaw Game"]
		// 3 drinks
		// 3 playpool
		// 1 swim laps
	];
	var aryOther=[
		["place.php?whichplace=arcade&action=arcade_plumber","JackassPlummer"]
	];
	for(var i=0;i<aryCamp.length;i++)	{		fireGM(aryCamp[i]); intCallsSent++;	}
	for(var i=0;i<aryChate.length;i++)	{		fireGM(aryChate[i]); intCallsSent++;	}
	for(var i=0;i<aryRumpus.length;i++)	{		fireGM(aryRumpus[i]); intCallsSent++;	}
	for(var i=0;i<aryVIP.length;i++)	{		fireGM(aryVIP[i]); intCallsSent++;	}
	for(var i=0;i<aryOther.length;i++)	{		fireGM(aryOther[i]); intCallsSent++;	}
	
	tmBreakfastCheck=setInterval( tmBreakfastCheck_tick,intBreakfastCheckInterval);
	
	
}
// ************************* //
// ************************* //
// ************************* //

function GetTextyObject()
{
	var retval;
	var obj=document.getElementById("dvTextyObject");
	if(obj!=undefined)	{		retval=obj;	}
	else	{		retval=document.createElement("div");		retval.setAttribute("id", "dvTextyObject");		document.body.insertBefore(retval,document.body.childNodes[0]);	}
	return retval;
}
function ShrinkImage(oImage,maxWidth,maxHeight)
{//	http://ericjuden.com/2009/07/jquery-image-resize/
	if(oImage!=undefined)
	{
		//var maxWidth = 50; // Max width for the image
    //var maxHeight = 50;    // Max height for the image
    var ratio = 0;  // Used for aspect ratio
    var width = oImage.width;    // Current image width
    var height = oImage.height;  // Current image height

    // Check if the current width is larger than the max
    if(width > maxWidth){
        ratio = maxWidth / width;   // get ratio for scaling image
        oImage.style.width=maxWidth+"px"; // Set new width
        oImage.style.height=(height * ratio)+"px";  // Scale height based on ratio
        height = height * ratio;    // Reset height to match scaled image
        width = width * ratio;    // Reset width to match scaled image
    }

    // Check if current height is larger than max
    if(height > maxHeight){
        ratio = maxHeight / height; // get ratio for scaling image
        oImage.style.height=maxHeight+"px";;   // Set new height
        oImage.style.width=(width * ratio)+"px";    // Scale width based on ratio
        width = width * ratio;    // Reset width to match scaled image
        height = height * ratio;    // Reset height to match scaled image
    }
	}
}

//Switch on which page we're looking at
switch(document.location.pathname) 
{
	case "/clan_viplounge.php":
		//GetPWDFromLounge();
		var oBackWall=$("img[src*='viptop.gif']");
		oBackWall.css( 'cursor', 'pointer' );
		oBackWall.attr('title', 'Click to run breakfast tasks');
		oBackWall.click(DoBreakfast);
	break;
	case "/account.php":
		//Set the images smaller
		var xp="/html/body/div[@id='options']/div[@id='tabs']/ul/li/a/img";
		var ulImages=findSet(xp);//UL listed but not CE listed?...i hate my sense of humor
		for (var i = 0; i < ulImages.snapshotLength; i++) 
		{
			var actualImg = ulImages.snapshotItem(i);
			ShrinkImage(actualImg,16,16);
			//actualImg.style.width="16px";			actualImg.style.height="16px";
    }
    //end smaller images
		charName=GetCharNameFromTop();//GetCharacterName();
		charTurns=GetCharTurnsFromTop();//GetCharacterTurns();
		if(charName==BadCharName)ReportError("account-found charName: '"+charName+"'");
		if(charTurns==BadTurnsCount)ReportError("account-found charTurns: "+charTurns+"");
		prekeyname=charName+"_"+basekeyname;
		InsertIntoAct();//currently, does things
	break;
	case "/mining.php":
		$("img[src*='wall']").css("border","1px solid transparent");
		$("img[src*='sparkle']").css("border","1px solid red");
		
	break;
	case "/topmenu.php":
	break;
	case "/charpane.php":
		//Its the charpane, it should be fine to get the name from here.
		setTimeout(function()
		{
			//if(document.body!=undefined)document.body.style.fontSize="8pt";
			charName=RipName(document,0);
			charTurns=RipTurns(document);
			prekeyname=charName+"_"+basekeyname;
			if(charName==BadCharName)ReportError("Self-found charName: '"+charName+"'");
			if(charTurns==BadTurnsCount)ReportError("Self-found charTurns: "+charTurns+"");
			
			InsertIntoCharPane();
			UpdateTopObject();//by doing this here, we should be ensuring that there's always a name and turn count?
		},
		10);
		//target=mainpane
		if(OkToShrinkCharpaneText)
		{//Shrink some charpane stuff
			//var finddrunktext_xp="/html/body/center[2]/table[2]/tbody/tr";
			//var drunktextresult=findSet(finddrunktext_xp);
			//for (var i = 0; i < drunktextresult.snapshotLength; i++) {			drunktextresult.snapshotItem(i).style.fontSize ="10px";    }
			var uppersection_xp="/html/body/center[2]/table"
			var uppersection_result=findSet(uppersection_xp);
			for (var i = 0; i < uppersection_result.snapshotLength; i++) { uppersection_result.snapshotItem(i).style.fontSize ="12px"; }
		}
		if(OkToShrinkCharpaneImages)
		{
			//Doesn't work??09/03/2014
			//var oAvatarImage=find("//a[@class='nounder']/img");		ShrinkImage(oAvatarImage,50,50);
			
			var img_find = document.getElementsByTagName("img");
			for(var i=0;i<img_find.length;i++)
			{
				//a[@class='nounder']/img			//if(img_find[i].src.indexOf("warfratoutfit")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}
				if(img_find[i].src.indexOf("classav")!=-1) {ShrinkImage(img_find[i],30,50);}//avatar?
				if(img_find[i].src.indexOf("horde")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//horde
				if(img_find[i].src.indexOf("extmeter")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//excitement	
				if(img_find[i].src.indexOf("bigbike")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//AoSP's motorcycle
				if(img_find[i].src.indexOf("jarlcomp")!=-1){img_find[i].style.width="25px";img_find[i].style.height="25px";}//AoJ's companions
				if( (img_find[i].getAttribute("onclick")+"").indexOf("desc_guardian")!=-1){img_find[i].style.width="15px";img_find[i].style.height="15px";}//Pasta Thrall
			}
		}
	break;
	case "/choice.php":
		charName=GetCharNameFromTop();//GetCharacterName();
		charTurns=GetCharTurnsFromTop();//GetCharacterTurns();
		if(charName==BadCharName)ReportError("fight-found charName: '"+charName+"'");
		if(charTurns==BadTurnsCount)ReportError("fight-found charTurns: "+charTurns+"");
		prekeyname=charName+"_"+basekeyname;
		//for choice also do a thing that ID's it
		var aryObj=document.getElementsByName('whichchoice');
		var ChoiceNumber=(aryObj.length>0)?aryObj[0].value:-1;
		var words="ChoiceAdventure="+((ChoiceNumber>-1)?ChoiceNumber:"???");//document.forms[0].elements['whichchoice'];
		if(ChoiceNumber ==-1)
		{//might be trick or treat, look at the Anchor list
			DoTrickOrTreat();
		}
		InsertState("Choices!");
		//words=document.location
		var txtObj=GetTextyObject();
		txtObj.innerHTML+=words+" ";
		ProcessChoice(ChoiceNumber);
		//there is no "break;" brecause I want it to also do what the fight script stuff does
		
	case "/fight.php":
		charName=GetCharNameFromTop();//GetCharacterName();
		charTurns=GetCharTurnsFromTop();//GetCharacterTurns();
		if(charName==BadCharName)ReportError("fight-found charName: '"+charName+"'");
		if(charTurns==BadTurnsCount)ReportError("fight-found charTurns: "+charTurns+"");
		prekeyname=charName+"_"+basekeyname;
		//setTimeout(function(){DoFight(charName,charTurns);},TimeToWaitToProccess);//changed to DoFight2() on 05/17/2011
		//setTimeout(function(){DoFight2();},TimeToWaitToProccess);
		
		var txtObj=GetTextyObject();
		txtObj.innerHTML+="DoFight3() time! ";
		
		setTimeout(DoFight3,TimeToWaitToProccess);
	break;
	case "/tiles.php":
		// http://www.kingdomofloathing.com/tiles.php?action=jump&whichtile=6 
		// From: http://www.kingdomofloathing.com/tiles.php?action=jump&whichtile=4
		var myTilesArray= [5,8,9,7,5,8,6];
		for(var i=0; i<7;i++)
		{
			var pos=myTilesArray[i];
			var theXP="//center/table/tbody/tr["+(i+1)+"]/td[@class='cell' and position()="+pos+"]";
			var res=find(theXP,document.body);
			if(res!=undefined) { res.style.border="1px solid red"; }
		}
		
	break;
	default:
}

function DoTrickOrTreat()
{
	var FoundOne=false;
	var ary=document.getElementsByTagName("a");
	for(var i=0; i< ary.length; i++)
	{
		if(	ary[i].href.indexOf("whichchoice=804")!=-1)//trick or treat!
		{
				var strToJump=ary[i].href;
				FoundOne=true;
				var timer = setInterval(function() {clearInterval(timer);document.location=strToJump;;}, TimeToWaitAdventureAgain);
				//do i want to BREAK; when i find one?
				break;
		}
	}
	if(ary.length==1 && !FoundOne)
	{
		//alert(ary[0]);
	}
	//Still here?
	var CanAutoContinue=GetAutoContinueAllowed();
	var minallowed=GetMinCharTurns();
	//always seems to lag behind by one
	if(ary.length==0 && CanAutoContinue && (charTurns>(minallowed+1)))
	{
		var strButtonYouWant="Scope out a new block (5 Adventures)";//var possiblechoice="Click on a house to go Trick-or-Treating!";
		var ary=document.getElementsByTagName("input");
		for(var i=0; i< ary.length; i++)
		{
			if(ary[i].value==strButtonYouWant)
			{
				var dd=ary[i];
				var timer = setInterval(function() {clearInterval(timer);dd.click();}, TimeToWaitAdventureAgain);				
			}
		}
	}
}

function ProcessChoice(ChoiceNumber)
{
	
	if(ChoiceNumber==1)//(doesn't exist)
	{ }
	else if(ChoiceNumber==15)//Yeti Nother Hippy
	{ CreateChoiceExpl(["item: eXtreme mittens","item: eXtreme scarf","meat"]); }
	else if(ChoiceNumber==16)//Saint Beernard
	{ CreateChoiceExpl(["item: snowboarder pants","item: eXtreme scarf","meat"]); }
	else if(ChoiceNumber==17)//Generic Teen Comedy Snowboarding Adventure
	{ CreateChoiceExpl(["item: eXtreme mittens","item: snowboarder pants","meat"]); }
	else if(ChoiceNumber==18)//A Flat Miner
	{ CreateChoiceExpl(["item: miner's pants","item: 7-Foot Dwarven mattock","meat"]); }
	else if(ChoiceNumber==19)//100% Legal
	{ CreateChoiceExpl(["item: miner's helmet","item: miner's pants","meat"]); }
	else if(ChoiceNumber==20)//See You Next Fall
	{ CreateChoiceExpl(["item: miner's helmet","item: 7-Foot Dwarven mattock","meat"]); }
	else if(ChoiceNumber==22)//The Arrrbitrator
	{ CreateChoiceExpl(['item: eyepatch','item: pants','meat']); }
	else if(ChoiceNumber==23)//Barrie Me at Sea
	{ CreateChoiceExpl(['item: parrot','item: pants','meat']); }
	else if(ChoiceNumber==24)//Amatearrr Night
	{ CreateChoiceExpl(['item: parrot','meat','item: eyepatch']); }
	else if (ChoiceNumber==26)//26 is A Three-Tined Fork
	{ CreateChoiceExpl(['seal-clubber/turtletamer','pastamancer/saucerer','discobandit/accordian thief']); }
	else if (ChoiceNumber==28)//A Pair of Craters
	{ CreateChoiceExpl(['(pastamancer gear)','(saucerer gear)']); }
	else if(ChoiceNumber==29)//The Road Less Visible
	{ CreateChoiceExpl(['(Disco Bandit)','(Accordion Thief)']); }
	else if(ChoiceNumber==73)//Don't Fence Me In
	{ CreateChoiceExpl(['stats: Muscle','item: white picket fence','item: piece of wedding cake or white rice']); }
	else if(ChoiceNumber==74)//The Only Thing About Him is the Way That He Walks
	{ CreateChoiceExpl(['stats: Moxie','item: boxes of wine','item: mullet wig']); }
	else if(ChoiceNumber==75)//Rapido!
	{ CreateChoiceExpl(['stats: Mysticality','item: jars of white lightning','item: white collar']); }
	else if(ChoiceNumber==77)//Minnesota Incorporeals
	{ CreateChoiceExpl(['stats: Moxie','<b>Broken</b>->[Go for a solid]-><b>A Hustle Here, a Hustle There</b>->[Go for the 8-ball]']); }
	else if(ChoiceNumber==78)//Broken
	{ CreateChoiceExpl(['[A Hustle Here, a Hustle There]','stats: Muscle']); }
	else if(ChoiceNumber==79)//A Hustle Here, a Hustle There
	{ CreateChoiceExpl(['item: Spookyraven library key','stats: Mysticality']); }
	else if(ChoiceNumber==82)//One Nightstand: white 
	{ CreateChoiceExpl(['wallet','stats: Muscle','Fight White nightstand']); }
	else if(ChoiceNumber==83)//One Nightstand: mahogany 
	{ CreateChoiceExpl(['item: old coin purse','fight: Mahogany nightstand','Spookyraven Manor Quest Item']); }
	else if(ChoiceNumber==84)//One Nightstand: Ornate 
	{ CreateChoiceExpl(['meat', 'stats: Mysticality','Lord Spookyraven\'s spectacles']); }
	else if(ChoiceNumber==85)//One Nightstand: Wooden 
	{ CreateChoiceExpl(['stats: Moxie', 'ballroom key after top drawer','fight: remains of a jilted mistress']); }
	else if(ChoiceNumber==105)//Having a Medicine Ball
	{ CreateChoiceExpl(['stats: Mysticality','choice: [Bad Medicine is What You Need](item choice) ','nothing <i>or</i> fight: The Guy Made Of Bees']); }
	else if(ChoiceNumber==111)//Malice in Chains
	{ CreateChoiceExpl(['stats: Muscle','Muscle points or hp loss','fight: sleeping Knob Goblin Guard']); }
	else if(ChoiceNumber==123)//At Least It's Not Full Of Trash
	{ CreateChoiceExpl(['Lose all HP','[Dvorak\'s Revenge]','Lose all HP']); }
	else if(ChoiceNumber==125)//No Visible Means of Support
	{ CreateChoiceExpl(['Lose all HP','Lose all HP','Find Hidden City']); }
	else if(ChoiceNumber==139)//Bait and Switch
		{ CreateChoiceExpl(['stats: Muscle','item: Ferret bait','fight: War Hippy (space) cadet']); }
	else if(ChoiceNumber==140)//The Thin Tie-Dyed Line
	{ CreateChoiceExpl(['item: water pipe bombs','stats: Moxie','combat: War Hippy drill sergeant']); }
	else if(ChoiceNumber==147)//Cornered!
	{ CreateChoiceExpl(['(Opens The Granary for adventuring.)','(Opens The Bog for adventuring.)','***(Opens The Pond for adventuring.)']); }
	else if(ChoiceNumber==148)//Cornered Again!
	{ CreateChoiceExpl(['***(Opens The Back 40 for adventuring.)','(Opens The Family Plot for adventuring.)']); }
	else if(ChoiceNumber==149)//How Many Corners Does this Stupid Barn Have!?
	{ CreateChoiceExpl(['(Opens The Shady Thicket for adventuring.)','***(Opens The Other Back 40 for adventuring.)']); }
	else if(ChoiceNumber==153)//Turn Your Head and Coffin
	{ CreateChoiceExpl(['stats: Muscle','meat','item: half-rotten brain']); }
	else if(ChoiceNumber==155)//Skull, Skull, Skull
	{ CreateChoiceExpl(['stats: Moxie','meat','item: rusty bonesaw']); }
	else if(ChoiceNumber==157)//Urning Your Keep
	{ CreateChoiceExpl(['stats: Mysticality','item: plus-sized phylactery','meat']); }
	else if(ChoiceNumber==163)//Melvil Dewey Would Be Ashamed
	{ CreateChoiceExpl(['item: Necrotelicomnicon','item: Cookbook of the Damned','item: Sinful Desires']); }
	else if(ChoiceNumber==182)//Random Lack of an Encounter
	{ CreateChoiceExpl(['(fight)','Penultimate Fantasy chest','(HP loss + stats)']); }	
	else if(ChoiceNumber==184)//That Explains All The Eyepatches
	{ CreateChoiceExpl(['myst: drunk/{fight}','moxie: drunk/{item: shot of rotgut}','muscle: drunk/{item: shot of rotgut}']); }
	else if(ChoiceNumber==185)//Yes, You're a Rock Starrr
	{ CreateChoiceExpl(['(bottles of plain booze)','(basic mixed drinks)','(fight or stats)']); }
	else if(ChoiceNumber==186)//A Test of Testarrrsterone
	{ CreateChoiceExpl(['stats','drunk+stats', 'stats: Moxie']); }
	else if(ChoiceNumber==188)//The Infiltrationist
	{ CreateChoiceExpl(['--frat outfit--','--mullet wig + briefcase--', '--frilly skirt + 3 hot wings']); }
	else if(ChoiceNumber==191)//Chatterboxing
	{ CreateChoiceExpl(['Moxie points','(lose health or lose trinket)','Muscle points', 'Mysticality points + cold damage']); }
	else if(ChoiceNumber==197)//Somewhat Higher and Mostly Dry
	{ CreateChoiceExpl(['{Sewer Tunnel}', 'combat: gsewer gator ','turn valve(lower water) <i>or</i> don\'t']); }
	else if(ChoiceNumber==198)//Disgustin' Junction
	{ CreateChoiceExpl(['{Sewer Tunnel}', 'combat: giant zombie goldfish','raise gate <i>or</i> don\'t']); }
	else if(ChoiceNumber==330)//A Shark's Chum
	{ CreateChoiceExpl(['stats: Muscle/Mysticality/Moxie', 'fight: hustled spectre']); }
	else if(ChoiceNumber==402)//Don't Hold a Grudge
	{ CreateChoiceExpl(['stats: Muscle', 'stats: Mysticality','stats: Moxie']); }
	else if(ChoiceNumber==451)//Typographical Clutter
	{	CreateChoiceExpl(['item: left parenthesis','(lose meat, then gain meat)','item: plus sign','stats: Mysticality','effect: Teleportitis']);	}
	else if(ChoiceNumber==502)//502 is the damn aborral respite
	{
		var t1='<b>Follow the ruts</b>: You gain some Meat.<br/><b>Knock on the cottage door</b>: wooden stakes<br/><b>Talk to the hunter</b>: Tree\'s Last Stand';
		var t2='<b>March to the marsh</b>: mosquito larva<br/><b>Squeeze into the cave</b>: 300 Meat, tree-holed coin<br/><b>Go further upstream</b>: An Interesting Choice';
		var t3='<b>Follow the even darker path</b>: A Three-Tined Fork<br/><b>Investigate the dense foliage</b>: Spooky-Gro fertilizer<br/><b>Follow the coin</b>: With tree-holed coin: O Lith, Mon';
		CreateChoiceExpl([t1,t2,t3]);
	}
	else if(ChoiceNumber==503)//The Road Less Traveled
	{	CreateChoiceExpl(['meat', 'item: wooden stakes OR [Have a Heart]','[Tree\'s Last Stand]']);	}
	else if (ChoiceNumber==505)//Consciousness of a Stream
	{ CreateChoiceExpl(['item: mosquito larva/spooky mushrooms','300meat+tree-holed coin','[An Interesting Choice]']); }
	else if (ChoiceNumber==506)//Through Thicket and Thinnet
	{ CreateChoiceExpl(['[A Three-Tined Fork]','item: Spooky-Gro fertilizer','[O Lith, Mon]']); }
	else if(ChoiceNumber==523)//Death Rattlin'
	{ CreateChoiceExpl(['meat','moxie/muscle/mysticallity stats, hp/mp heal','item: can of Ghuol-B-Gone™','(fight whelps based on +ML)']); }
	else if (ChoiceNumber==556)//More Locker Than Morlock
	{ CreateChoiceExpl(['item: safety vest or item: miner\'s pants or item: 7-Foot Dwarven mattock','']); }
	
	/*****************************************************/
	/*****************************************************/
	/*
	else if (ChoiceNumber==570)
	{		DoWalkthroughFromAdventureChoice(ChoiceNumber);	}
	else if (ChoiceNumber==659 || ChoiceNumber==660 || ChoiceNumber==661 || ChoiceNumber==662 || ChoiceNumber==663)//these are the 3-way choice
	{		DoWalkthroughFromAdventureChoice(ChoiceNumber);	}
	else if (ChoiceNumber==665)//the maze
	{		DoWalkthroughFromAdventureChoice(ChoiceNumber);	}
	*/
	/*****************************************************/
	/*****************************************************/
	
	else if(ChoiceNumber==579)//Such Great Heights
	{ CreateChoiceExpl(['stats: Mysticality', 'item: the Nostril of the Serpent','+3 turns and extend buffs(once)']); }
	else if(ChoiceNumber==580)//The Hidden Heart of the Hidden Temple --(Stone)--All of them
	{ CreateChoiceExpl(['stats: Muscle or item: ancient calendar fragment or +MP or [At Least It\'s Not Full Of Trash] or nothing', '[Confusing Buttons] or [Unconfusing Buttons]','stats: Moxie + effct: Poisoned']); }
	else if(ChoiceNumber==581)//Such Great Depths
	{ CreateChoiceExpl(['item: glowing fungus', 'effect: Hidden Power','fight: clan of cave bars']); }
	else if(ChoiceNumber==582)//Fitting In
	{ CreateChoiceExpl(['[Such Great Heights] (Get Nostril)', '[The Hidden Heart of the Hidden Temple]','[Such Great Depths]']); }
	else if(ChoiceNumber==584)//Unconfusing Buttons
	{ CreateChoiceExpl(['[The Hidden Heart of the Hidden Temple (Stone)]', '[The Hidden Heart of the Hidden Temple (Sun)]','[The Hidden Heart of the Hidden Temple (Gargoyle)]','[The Hidden Heart of the Hidden Temple (Pikachutlotal)]']); }
	else if(ChoiceNumber==594)//A Lost Room
	{ CreateChoiceExpl(['(Do this)','(Then do this)','(Do this third)','item: The Lost Glasses','item: The Lost Comb','item: The Lost Pill Bottle', '(Keep doing this)']); }
	else if(ChoiceNumber==669)//The Fast and the Furry-ous
	{ CreateChoiceExpl( [ 'Ground Floor Access(with titanium assault umbrella)', 'stats: Moxie', '(What is this?)', '(Leave?)']); }
	else if(ChoiceNumber==670)//You Don't Mess Around with Gym
	{ CreateChoiceExpl(['item: massive dumbbell','stats: Muscle','items: ','Ground Floor Access(with amulet of extreme..)','Leave(back to Out in the Open Source or back to castle map)']); }
	else if(ChoiceNumber==671)//Out in the Open Source
	{ CreateChoiceExpl(['Ground Floor Access(with dumbbell)','stats: Mysticality','item: O\'RLY manual, item: open sauce','Goto: You Don\'t Mess Around with Gym']); }
	else if(ChoiceNumber==672)//There's No Ability Like Possibility
	{ CreateChoiceExpl(['(three items)', 'effect: Nothing Is Impossible', '(leave)']);}
	else if(ChoiceNumber==674)//Huzzah!
	{ CreateChoiceExpl(['item: pewter claymore', 'effect: Pretending to Pretend', '(leave)']);}
	
	else if(ChoiceNumber==837)//On Purple Pond
	{ CreateChoiceExpl(['(which assulters wont be fighting?)', '+1 Moat', '+X Candy', '??', '??','??' ]);}
	else if(ChoiceNumber==838)//General Mill
		{ CreateChoiceExpl(['+1 Moat', '+259 Candy or +1025 Candy', '??', '??', '??','??' ]);}
	else if(ChoiceNumber==839)//The Sounds of the Undergrounds
	{ CreateChoiceExpl(['(which assulters will be fighting)', '+1 Minefield Strength', '+247 Candy', '??', '??','??' ]);}
	else if(ChoiceNumber==840)//Hop on Rock Pops
	{ CreateChoiceExpl(['+1 Minefield Strength', '+248 Candy', '??', '??', '??','??' ]);}
	else if(ChoiceNumber==841)//Building, Structure, Edifice
	{ CreateChoiceExpl(['(hear whispering voice)', '+2 Wall Strength or +2 Anti-Aircraft Turrets or +2 Poison Jars', '+150 Candy', '??', '??','??' ]);}
	else if(ChoiceNumber==842)//The Gingerbread Warehouse
	{ CreateChoiceExpl(['+1 Wall Strength', '+1 Poison Jar', '+1 Anti-Aircraft Turret', '+155 Candy or +954 Candy', '??','??' ]);}
	
	else if(ChoiceNumber==872)//Drawn Onward
	{ 
		var names872=['Shelf #1 -- photograph of God','Shelf #2 -- photograph of a red nugget', 'Shelf #3 -- photograph of a dog','Shelf #4 -- photograph of an ostrich egg'];
		for(var i=0;i<4;i++)
		{
			var choice=document.getElementsByName("photo"+(i+1));
			if(choice.length>0)			{choice[0].parentNode.appendChild(CreateTinyDivWithHTMLContents(names872[i]));}
		}
		var choice1=document.getElementsByName("photo1");		if(choice1.length>0){choice1[0].selectedIndex =0;}
		var choice2=document.getElementsByName("photo2");		if(choice2.length>0){choice2[0].selectedIndex =2;}
		var choice3=document.getElementsByName("photo3");		if(choice3.length>0){choice3[0].selectedIndex =1;}
		var choice4=document.getElementsByName("photo4");		if(choice4.length>0){choice4[0].selectedIndex =3;}
		//CreateChoiceExpl(['','Shelf #1 -- photograph of God<br/>Shelf #2 -- photograph of a red nugget<br/>Shelf #3 -- photograph of a dog<br/>Shelf #4 -- photograph of an ostrich egg']);
	}
	
	else if(ChoiceNumber==875)//Welcome To Our ool Table
	{ CreateChoiceExpl(['item: Spookyraven library key', '[Pool Skill]', 'Leave', '??', '??','??' ]);}
	else if(ChoiceNumber==876)//One Simple Nightstand
	{ CreateChoiceExpl(['item: old leather wallet', 'stats: Muscle', 'stats: Muscle', '??', '??','Leave' ]);}
	else if(ChoiceNumber==877)//One Mahogany Nightstand
	{ CreateChoiceExpl(['item: half of a memo or item: old coin purse', 'lose HP', 'Spooky quest item for spooky skill' ]);}
	else if(ChoiceNumber==878)//One Ornate Nightstand
	{ CreateChoiceExpl(['meat', 'stats: Mysticality', "item: Lord Spookyraven's spectacles", 'item: disposable instant camera',  'stats: Mysticality','Leave' ]);}
	else if(ChoiceNumber==879)//One Rustic Nightstand
	{ CreateChoiceExpl(['stats: Moxie', 'item: grouchy restless spirit', 'fight: remains of a jilted mistress', '??stats: Moxie', '??','Leave' ]);}
	else if(ChoiceNumber==880)//One Elegant Nightstand
	{ CreateChoiceExpl(["item: Lady Spookyraven's finest gown *****", 'item: elegant nightstick', '??stats: Muscle, Moxie, Mysticality', '??', '??','Leave' ]);}
}


function GetChoiceNames()
{
	var aryChoiceNames=new Array();
	var i=1;
	var thechoice=document.getElementsByName("choiceform"+i)[0];
	while(thechoice!=undefined)
	{		//now i have the form, cycle through child elements
		for(var cidx=0;cidx<thechoice.elements.length;cidx++)
		{
			if(thechoice.elements[cidx]["type"]=="submit")	{				aryChoiceNames.push(thechoice.elements[cidx].value);			}
		}
		i++;
		thechoice=document.getElementsByName("choiceform"+i)[0];
	}
	return aryChoiceNames;
}

function CreateChoiceExplanation(t1,t2,t3,t4)
{
	var choice1=document.getElementsByName("choiceform1");
	var choice2=document.getElementsByName("choiceform2");
	var choice3=document.getElementsByName("choiceform3");
	var choice4=document.getElementsByName("choiceform4");
	var text1=CreateTinyDivWithHTMLContents(t1);
	var text2=CreateTinyDivWithHTMLContents(t2);
	var text3=CreateTinyDivWithHTMLContents(t3);
	var text4=CreateTinyDivWithHTMLContents(t4);
	if(choice1.length>0&t1!=undefined)choice1[0].appendChild(text1);
	if(choice2.length>0&t2!=undefined)choice2[0].appendChild(text2);
	if(choice3.length>0&t3!=undefined)choice3[0].appendChild(text3);
	if(choice4.length>0&t4!=undefined)choice4[0].appendChild(text4);
}
function CreateChoiceExpl(textarray)
{
	for(var i=1;i<=textarray.length;i++)
	{
		var t=textarray[i-1];
		var thechoice=document.getElementsByName("choiceform"+i);
		var thetext=CreateTinyDivWithHTMLContents(t);
		if(thechoice.length>0&t!=undefined)thechoice[0].appendChild(thetext);
	}
}
function CreateTinyDivWithHTMLContents(htmlcontents)
{
	var text1=document.createElement("div");
	if(text1!=undefined)	{		text1.style.fontSize="8pt";		text1.innerHTML=(htmlcontents);	}
	return text1;
}

function ReportError(errstr)//Sneaky little function to make an entry in the error console
{	//As of 05/11/2012 this no longer works!
		//setTimeout("] "+errstr,0);
		//alert(errstr);
		GM_log(errstr);
}

function find(xp,location) 
{//Code to search for elements using XPath, (technically returns a node set, but singleNodeValue returns the exact object)
	if(!location)location = document;
	var temp = document.evaluate(xp, location, null, XPathResult.FIRST_ORDERED_NODE_TYPE,null);
	return temp.singleNodeValue;
}
function findSet(xp,location) 
{//Code to search for elements using XPath, returns a node set
	if(!location)location = document;
	var temp = document.evaluate(xp, location, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
	return temp;
}
function EvalOnContentPage(source) 
{
  if ('function' == typeof source) // Check for function input.
  {// Execute this function with no arguments, by adding parentheses. One set around the function, required for valid syntax, and a
    source = '(' + source + ')();';  // second empty set calls the surrounded function.
  }
  // Create a script node holding this  source code.
  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.textContent = source;
  document.body.appendChild(script);// Insert the script node into the page, so it will run,
  document.body.removeChild(script);// and immediately remove it to clean up.
}
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RipName(baseDocument,OptionalCount)
{
	return ($("a[href*='charsheet']").text()||BadCharName);// 12/15/2014 seems to always work?
}
function RipTurns(baseDocument)
{
	var strTurns="";
	if(strTurns=="") { strTurns=$("img[src*='hourglass']").siblings("span").text(); }//console.log("Result1="+strTurns); }// (base charpane)
	if(strTurns=="") { strTurns=$("td:contains('Adv')").siblings().text();}// console.log("Result2="+strTurns);  } //Use Compact Character Pane
	if(strTurns=="") { strTurns=$("img[src*='hourglass']").parent().next().text(); }//console.log("Result3="+strTurns);  }//Use Slim HP/MP/Meat/Adv Display (only applies in non-compact character pane)
	return parseInt( (strTurns||BadTurnsCount) );
}

function old_RipName(baseDocument,OptionalCount)
{
	//for other pages: top.frames[1].document
	//for character page: document
	var retval=BadCharName;
	var StartTime=new Date();
	var TryCount=0;
	var Found=0;
	var xp="//a/b";
	if(OptionalCount==undefined)OptionalCount=0;
	
	var res=find(xp,baseDocument);
	if(res!=undefined)	{		retval=res.innerHTML;			}
	else
	{
		OptionalCount++;
		ReportError("RipName: XPath failed: "+OptionalCount);
		if(OptionalCount<15)setTimeout(function(){charName=RipName(document,OptionalCount);},100);
	}
	var EndTime=new Date();
	charFindTime=EndTime-StartTime;
	return retval;
}

function old_RipTurns(baseDocument)
{
	//stolen from Anarch => http://ashvin.21.googlepages.com
	var retval=BadTurnsCount;	
	var rB=false;	
	var docu=baseDocument;//top.frames[1].document;
	var xp="//img[contains(@src,'hourglass.gif')]/following-sibling::*/following-sibling::*"
	var res=find(xp,baseDocument);
	if(res!=undefined)	{		retval = parseInt(res.innerHTML);	}
	else	{		ReportError("RipTurns: XPath failed ");	}
	return retval;
}
function UpdateTopObject()
{
	var obj=top.document.getElementById(tname);
	if(obj!=undefined)
	{//edit it
		//ReportError("UpdateTopObject: Setting top object["+obj.id+"]");
		if((charName!=BadCharName)&&(charName!=""))			{			obj.setAttribute("title",charName);		}
		else		{			ReportError("UpdateTopObject: bad charName");		}
		if((charTurns!=BadTurnsCount))			{			obj.setAttribute("value", charTurns);		}
		else		{			ReportError("UpdateTopObject: bad charTurns");		}
	}
	else
	{//build it
		ReportError("UpdateTopObject: building top object");
		var nobj=top.document.createElement("input");
		nobj.setAttribute("type", "hidden");
		nobj.setAttribute("title",charName);
		nobj.setAttribute("value", charTurns);
		nobj.id=tname;
		nobj.style.display="none";
		top.document.body.appendChild(nobj);
	}
}
function GetCharNameFromTop()
{
	var retval=BadCharName;
	var obj=top.document.getElementById(tname);
	if(obj!=undefined)	{		retval=	obj.title;	}//edit it
	else	{		ReportError("GetCharNameFromTop: obj not exist.");	}//consider ripping from RipName(top.frames[1].document)
	if(retval==BadCharName)ReportError("GetCharNameFromTop: returning "+retval);
	return retval;
}
function GetCharTurnsFromTop()
{
	var retval=BadTurnsCount;
	var obj=top.document.getElementById(tname);
	if(obj!=undefined)	{		retval=	obj.value;	}//edit it
	else	{		ReportError("GetCharTurnsFromTop: obj not exist.");	}//consider ripping from RipTurns(top.frames[1].document)
	if(retval==BadTurnsCount)ReportError("GetCharTurnsFromTop: returning -1");
	return retval;
}

function InsertIntoAct()
{//TODO list things here in the account page so you can remove them(like other GM scripts do)
	//Get the minimum turn count (and the list of snarfblats?)
	var MinTurns=GetMinCharTurns();
	var divobj=document.createElement("div");
	if(divobj!=undefined)
	{
		divobj.id=accountpagebaseid+"2";
		divobj.innerHTML="Stop when there are this many turns left:<br/>";
		var tbobj=document.createElement("input");
		if(tbobj!=undefined)
		{
			divobj.appendChild(tbobj);
			tbobj.id=accountpagebaseid+"_MinTurns_Input";
			tbobj.setAttribute("type", "text");
			tbobj.style.width="75px";//Just because it annoyed me
			tbobj.setAttribute("value", MinTurns);	
			tbobj.setAttribute("title", "Press enter to save");
			tbobj.addEventListener('keypress',function(evt)
			{
				var kp=evt.charCode || evt.keyCode;
				if(kp==13)//enter press
				{				ExecuteMinTurnsSave();				evt.preventDefault();				}
			},false);
		}
		var btobj=document.createElement("input");
		if(btobj!=undefined)
		{
			divobj.appendChild(btobj);
			btobj.setAttribute("type", "button");
			btobj.setAttribute("value", "Save");
			btobj.addEventListener('click',function(evt) 			{				ExecuteMinTurnsSave();				evt.preventDefault();			},true);
			//need add save handler
		}
		var lbobj=document.createElement("span");
		if(lbobj!=undefined)
		{
			divobj.appendChild(lbobj);
			lbobj.id=accountpagebaseid+"_MinTurns_Result";
			lbobj.style.color="green";
			lbobj.style.margin="11px 11px 11px 11px";
			lbobj.innerHTML="";
			//set size
		}
		divobj.appendChild(document.createElement("br"));
		var div_AutoContinue=document.createElement("span");
		var lb_AutoContinue=document.createElement("span");
		if((div_AutoContinue!=undefined)&&(lb_AutoContinue!=undefined))
		{
			divobj.appendChild(div_AutoContinue);
			
			div_AutoContinue.setAttribute("type", "button");
			div_AutoContinue.id=accountpagebaseid+"_AutoContinue";
			div_AutoContinue.style.fontSize="8pt";
			div_AutoContinue.innerHTML="AutoContinue: ";//+
			div_AutoContinue.appendChild(lb_AutoContinue);
			lb_AutoContinue.id=accountpagebaseid+"_lb_AutoContinue";
			lb_AutoContinue.innerHTML="<b>"+((GetAutoContinueAllowed() == 1) ? "ON" : "OFF");
			lb_AutoContinue.style.cursor="pointer";
			lb_AutoContinue.style.textDecoration="underline";
			
			div_AutoContinue.addEventListener('click',function(evt) 
			{
				evt.preventDefault();			//this.removeEventListener('click',arguments.callee,false);
				var state=GetAutoContinueAllowed();
				var rr=SetAutoContinueAllowed(!state);
				//div_AutoContinue.div="AutoContinue: "+((GetAutoContinueAllowed() == 1) ? "ON" : "OFF");//charName+"["+charTurns+"]: <b>"+(((!state) == 1) ? "ON" : "OFF")+"</b><br/>";
				lb_AutoContinue.innerHTML="<b>"+((GetAutoContinueAllowed() == 1) ? "ON" : "OFF");
			},true);
		}
		
		InsertTableIntoAccountInterface(accountpagebaseid+"tab","Plater's AutoCombat",divobj);
	}
}

function ExecuteMinTurnsSave()
{
	var obj=document.getElementById(accountpagebaseid+"_MinTurns_Input");
	if(obj!=undefined)	
	{		
		var MinTurns=parseInt(obj.value);
		SetMinCharTurns(MinTurns); 	
		var tobj=document.getElementById(accountpagebaseid+"_MinTurns_Result");	
		if(tobj!=undefined)		{	tobj.innerHTML="Saved! "+MinTurns;}
		else{		alert("Saved! "+MinTurns);}
	}
	else{alert("Failure!");}
}

function InsertTableIntoAccountInterface(tabID,tabTitleString, tabInnerObj)
{//here is where it gets fun?
	var testobj=document.getElementById(tabID);
	if(testobj!=undefined) testobj.parentNode.removeChild(testobj);
	
	var xp="/html/body/div[@id='options']/div[@id='tabs']/ul";
	var ulListing=find(xp);//UL listed but not CE listed?...i hate my sense of humor
	var myLI=document.createElement("li");
	if((ulListing!=undefined)&&(myLI!=undefined))
	{
		ulListing.style.fontSize="8pt";
		ulListing.appendChild(myLI);
		myLI.id=tabID;
		myLI.style.fontSize="7pt";//Nice and tiny
		myLI.onclick="";
		myLI.innerHTML="<img border=\"0\" src=\""+ScriptIcon+"\" align=\"absmiddle\" height=\"16\" width=\"16\" style=\"padding-right: 10px; \" /><u>"+tabTitleString+"</u></div>";
		//The myLI object inherits an onClick event from the jQuery in actual page, cannot seem to get rid of it.
		jQuery(		function($) 		{			$('#'+tabID).unbind();		}		);//try to remove the old click
		myLI.addEventListener('click',function(evt) 
		{
			LoadOptionsTabContents(tabID,tabTitleString,tabInnerObj);
			evt.preventDefault();
		},true);		
	}
}
function LoadOptionsTabContents(tabID,tabTitleString,tabInnerObj)
{
	var divGuts=document.getElementById("guts");
	var tab = document.getElementById(tabID);
	$('.helpbox').remove();
	$('.disabled').remove();
	$('#tabs li').removeClass('active');
	$('#'+tabID).addClass('active');
	$('#guts').css('opacity', 0.2);
	var oRunningInterval=setInterval(function()
	{
		var divGuts=document.getElementById("guts");
		if((divGuts.innerHTML.indexOf("You managed to click a non-existant tab")!=-1)||(divGuts.childNodes.length==0))//it might be the case that CDM gets rid of the error message
		{
			$('#guts').empty();
			$('#guts').append('<div class="scaffold"></div><b>'+tabTitleString+':<b/>');
			$('#guts').append(tabInnerObj);
			$('#guts').append('<div class="clear"></div>');
			$('#guts').css('opacity', '');
			clearInterval(oRunningInterval);
		}
	},10);
}

function InsertIntoCharPane()
{
	var betterxp="/html/body/center/table/tbody";//"/html/body/center[2]/table[1]/tbody";
	var o2=find(betterxp,document.body);
	if((o2!=undefined))
	{
		if(charName!=BadCharName)
		{//make a row and a td with colspan=2
				var divAutoContinue=document.getElementById("div_"+prekeyname+"_autocontinue");
				if(divAutoContinue!=undefined) divAutoContinue.parentNode.removeChild(divAutoContinue);
				divAutoContinue=CreateAutoContinueSwitcherRow(GetAutoContinueAllowed());
				if(divAutoContinue!=undefined)o2.appendChild(divAutoContinue);
		}
		else
		{//make a box offering to reload frame
			ReportError("InsertIntoCharPane: Making reload link");
			var dd=document.createElement('a');
			if(dd!=undefined)
			{
				dd.appendChild(document.createTextNode("(Reload)"));
				dd.style.fontSize="8pt";
				dd.href ="javascript:window.location.reload()";
				newTD.appendChild(dd);
			}
		}
	}
	else{ /*//Fail Silently// alert('help');*/}
}

function CreateAutoContinueSwitcherRow(state)
{
	var newTR = document.createElement('tr');
	var newTD = document.createElement('td');
	if((newTR!=undefined)&&(newTD!=undefined))
	{
		newTR.appendChild (newTD);
		newTR.id="div_"+prekeyname+"_autocontinue";
		
		//newTD.style.backgroundColor="green";
		newTD.colSpan="2";		
		newTD.style.fontSize="8pt";
		newTD.style.cursor ='pointer';
		newTD.innerHTML=charName+"["+charTurns+"]: <b>"+((state == 1) ? "ON" : "OFF")+"</b><br/>";
		newTD.addEventListener('click',function(evt) 
		{
			evt.preventDefault();			//this.removeEventListener('click',arguments.callee,false);
			var rr=SetAutoContinueAllowed(!state);
			//newTD.innerHTML=charName+"["+charTurns+"]: <b>"+(((!state) == 1) ? "ON" : "OFF")+"</b><br/>";
			InsertIntoCharPane();
		},true);
	}
	
	return newTR;
}

function SetAutoAttackAllowed(val){	GM_setValue(prekeyname+"Allowed", val);	}
function GetAutoAttackAllowed(){	return GM_getValue(prekeyname+"Allowed",0);	}

function SetAutoContinueAllowed(val){	GM_setValue(prekeyname+"Continue_Allowed", val);		var ret=GM_getValue(prekeyname+"Continue_Allowed", null);	return (ret==val);		}
function GetAutoContinueAllowed(){return GM_getValue(prekeyname+"Continue_Allowed",0);	}
//alert("Trying\r\n"+prekeyname+"Continue_Allowed");
//	return GM_getValue(prekeyname+"Continue_Allowed",0);
function GetMinCharTurns(){	var cturns=GM_getValue(prekeyname+"MinCharTurns",50);	SetMinCharTurns(cturns);	return cturns;	}
function SetMinCharTurns(turns){	GM_setValue(prekeyname+"MinCharTurns", turns);	}

function DoFight2()
{//Since combat macros came out, the combat part is not required.
	try
	{
		if(charName!=BadCharName)
		{//ok to look for things
			var atkButton=document.getElementById("tack"); 
			var CanAutoContinue=GetAutoContinueAllowed();
			//do an IF about the attack button
			if(atkButton!=undefined)			{		InsertState("Waiting...");		}
			else
			{
				var FightLost=0;
				var strToJump="";
				//var xp="/html/body/center/table/tbody" 		//xp="/html/body/center/table/tbody/tr[2]/td/center/table/tbody/tr/td/center";
				var myobj=document.body;
				if(myobj.innerHTML.indexOf("You lose.")!=-1)FightLost=1;//could occur for over 30rounds or when beaten up
				if(FightLost==1)				{			InsertState("Fight lost, stopping. (<a href=\"/campground.php?action=rest\">Rest?</a>)");		}
				else
				{//no beaten up! Or otherwise lose
					if(CanAutoContinue==1)
					{
						var minallowed=GetMinCharTurns();
						if(charTurns>(minallowed+1))//always seems to lag behind by one
						{
							var els = document.getElementsByTagName('a');
							for(var i=0;i<els.length;i++)
							{
								if(els[i].innerHTML.indexOf("Adventure Again")==0 || els[i].innerHTML.indexOf("Do it again")==0)
								{							strToJump=els[i].href;							break;						}
							}
							if(strToJump!="")
							{//TODO check for too low of HP??
								InsertState("Continuing to adventure");
								GM_log("Continuing to adventure");
								var timer = setInterval(function() {clearInterval(timer);DoJump(strToJump);}, TimeToWaitAdventureAgain);
								//window.setTimeout( new function(){	DoJump(strToJump);	},TimeToWaitAdventureAgain);//Changing to a onetime use setInterval seems to have fixed this?
							}
							else						{		InsertState("Auto adventure stopped?");					}
						}//end of still has turns to use
						else 					{		InsertState("AutoContinue stopped, reached minimum turns");	}
					}//end of allowed to auto continue
					else				{		InsertState("AutoContinue disabled");			}
				}//end of fight not lost
			}//end of no attack button, fight is over
		}//end of good charName
		else	{		InsertState("charactername not found!");	}
	}
	catch(error)
	{		ReportError(error);	}
}
function DoFight3()//05/11/2012
{//Since combat macros came out, the combat part is not required.
	var StateString="Opening State or Error";
	try
	{
		StateString=("charactername not found!");	
		if(charName!=BadCharName)
		{//ok to look for things
			
			var atkButton=document.getElementById("tack"); 
			var CanAutoContinue=GetAutoContinueAllowed();
			//do an IF about the attack button
			StateString=("Waiting...");
			if(!(atkButton!=undefined))
			{
				
				StateString=("Fight lost, stopping. (<a href=\"/campground.php?action=rest\">Rest?</a>)");
				var FightLost=0;
				var strToJump="";
				//var xp="/html/body/center/table/tbody" 		//xp="/html/body/center/table/tbody/tr[2]/td/center/table/tbody/tr/td/center";
				var myobj=document.body;
				if(myobj.innerHTML.indexOf("You lose.")!=-1)FightLost=1;//could occur for over 30rounds or when beaten up
				if(FightLost!=1)
				{//no beaten up! Or otherwise lose
					//InsertTopStuff("CanAutoContinue: "+CanAutoContinue);
					StateString=("AutoContinue disabled");
					if(CanAutoContinue==1)
					{
						StateString=("AutoContinue stopped, reached minimum turns");
						var minallowed=GetMinCharTurns();
						if(charTurns>(minallowed+1))//always seems to lag behind by one
						{
							StateString=("Auto adventure stopped?(No URL found?)");	
							var els = document.getElementsByTagName('a');
							for(var i=0;i<els.length;i++)
							{
								if(	els[i].innerHTML.indexOf("Adventure Again")==0 
										|| els[i].innerHTML.indexOf("Do it again")==0 
									 || els[i].innerHTML.indexOf("Fight Again (1)")==0 
										|| els[i].innerHTML.indexOf("Back to Trick-or-Treating")==0
										|| els[i].innerHTML.indexOf("You investigate the now-still")==0)
								{		strToJump=els[i].href;		break;		}
							}
							if(strToJump!="")
							{//TODO check for too low of HP??
								StateString=("Continuing to adventure");
								//GM_log("Continuing to adventure");
								var timer = setInterval(function() {clearInterval(timer);DoJump(strToJump);}, TimeToWaitAdventureAgain);
								//window.setTimeout( new function(){	DoJump(strToJump);	},TimeToWaitAdventureAgain);//Changing to a onetime use setInterval seems to have fixed the weird error?
							}//end of non-blank string
						}//end of still has turns to use
					}//end of allowed to auto continue
				}//end of fight not lost
			}//end of no attack button, fight is over
		}//end of good charName
	}//end of try
	catch(error)
	{		ReportError(error);		}
	InsertState(StateString);
}

function DoJump(strToJump)
{
	InsertState("*****JUMP*****");
	//GM_log("*****JUMP*****");//GM_log("Jump: "+strToJump);
	document.location=strToJump;
	//document.location.reload(false);
	//document.location.assign(strToJump);
	//GM_log("Jump failed");
}

function InsertTopStuff(txtmsg){	var myNode=document.createTextNode(txtmsg);	var chNode=document.body.childNodes[0];	document.body.insertBefore(myNode,chNode);}
function InsertState(statetext)
{
	var spanobj;
	var WasSuccesfull=0;
	try
	{
		var xp="/html/body/center/table/tbody/tr[2]/td/center/table/tbody/tr/td/center/table/tbody/tr";//wrong
		xp="/html/body/center/table/tbody/tr[2]/td/center/table/tbody/tr/td/center[1]/table/tbody/tr/td[2]";//right
		var spanobj=find(xp,document.body);
		if(spanobj!=undefined)
		{
			var myspan=document.createElement('span');
			if (myspan!=undefined)
			{
				statetext=charName+"["+charTurns+"]("+charFindTime+") Action: "+statetext;
				myspan.innerHTML=statetext;
				myspan.style.color="red";
				myspan.style.fontSize="8pt";
				spanobj.appendChild(document.createElement('br'));
				spanobj.appendChild(myspan);
				WasSuccesfull=1;
			}
		}
		if(WasSuccesfull==0) {ReportError("Failure to InsertState ["+statetext+"]");}
	}
	catch(error)	{		ReportError(error);		}
}