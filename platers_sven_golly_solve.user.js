// ==UserScript==
// @name           Plater's Sven Golly Solver
// @namespace      platertopia.com
// @description    (Ver 1.0) Attempt to fill in the correct answer for sven golly 
// @include        *kingdomofloathing.com/pandamonium.php?action=sven
// @include        http://127.0.0.1:60*/*pandamonium.php?action=sven
//
// @copyright 2011+, Plater (http://www.platertopia.com/) 
// ==/UserScript==

//
// Version 1.0	09/29/2011	First version, attempts to select the bandmate and the item, will use the "shared" item if: 
//														the other is done, OR the other has their primary available


var BognortIDX=-1;
var StinkfaceIDX=-1;
var FlargwurmIDX=-1;
var JimIDX=-1;

var GiantMarshmallowIDX=-1;
var BeerScentedTeddyBearIDX=-1;
var GinSoakedBlotterPaperIDX=-1;//shared
var BoozeSoakedCheeryIDX=-1;
var ComfyPillowIDX=-1;
var SpongeCakeIDX=-1;//shared

var ddBandMember=undefined;
var ddToGive=undefined;

/*  
		* Bognort the giant marshmallow or gin-soaked blotter paper
    * Stinkface the beer-scented teddy bear or gin-soaked blotter paper
    * Flargwurm the booze-soaked cherry or sponge cake
    * Jim the sponge cake or comfy pillow 
*/

LocateSelects();
CheckForBandMates();
CheckForItems();
ChangeTheSelects();
//ShowResults();

function ChangeTheSelects()
{
	//primarys
	if ((BognortIDX!=-1)&&(GiantMarshmallowIDX!=-1))
	{
		ddBandMember.options.selectedIndex=BognortIDX;
		ddToGive.options.selectedIndex=GiantMarshmallowIDX;
	}
	else if ((StinkfaceIDX!=-1)&&(BeerScentedTeddyBearIDX!=-1))
	{
		ddBandMember.options.selectedIndex=StinkfaceIDX;
		ddToGive.options.selectedIndex=BeerScentedTeddyBearIDX;
	}
	else if ((FlargwurmIDX!=-1)&&(BoozeSoakedCheeryIDX!=-1))
	{
		ddBandMember.options.selectedIndex=FlargwurmIDX;
		ddToGive.options.selectedIndex=BoozeSoakedCheeryIDX;
	}
	else if ((JimIDX!=-1)&&(ComfyPillowIDX!=-1))
	{
		ddBandMember.options.selectedIndex=JimIDX;
		ddToGive.options.selectedIndex=ComfyPillowIDX;
	}
	//now do shared
	//Bognort
	if ( ((BognortIDX!=-1)&&(GinSoakedBlotterPaperIDX!=-1)&&(BeerScentedTeddyBearIDX!=-1))//other primary is available, use 2ndary
		||((BognortIDX!=-1)&&(GinSoakedBlotterPaperIDX!=-1)&&(StinkfaceIDX==-1)))//2ndary is available and other primary is done
	{
		ddBandMember.options.selectedIndex=BognortIDX;
		ddToGive.options.selectedIndex=GinSoakedBlotterPaperIDX;
	}
	//Stinkface
	if ( ((StinkfaceIDX!=-1)&&(GinSoakedBlotterPaperIDX!=-1)&&(GiantMarshmallowIDX!=-1))//other primary is available, use 2ndary
		||((StinkfaceIDX!=-1)&&(GinSoakedBlotterPaperIDX!=-1)&&(BognortIDX==-1)))//2ndary is available and other primary is done
	{
		ddBandMember.options.selectedIndex=StinkfaceIDX;
		ddToGive.options.selectedIndex=GinSoakedBlotterPaperIDX;
	}
	//Flargwurm
	if ( ((FlargwurmIDX!=-1)&&(SpongeCakeIDX!=-1)&&(ComfyPillowIDX!=-1))//other primary is available, use 2ndary
		||((FlargwurmIDX!=-1)&&(SpongeCakeIDX!=-1)&&(JimIDX==-1)))//2ndary is available and other primary is done
	{
		ddBandMember.options.selectedIndex=FlargwurmIDX;
		ddToGive.options.selectedIndex=SpongeCakeIDX;
	}
	//Jim
	if ( ((JimIDX!=-1)&&(SpongeCakeIDX!=-1)&&(BoozeSoakedCheeryIDX!=-1))//other primary is available, use 2ndary
		||((JimIDX!=-1)&&(SpongeCakeIDX!=-1)&&(FlargwurmIDX==-1)))//2ndary is available and other primary is done
	{
		ddBandMember.options.selectedIndex=JimIDX;
		ddToGive.options.selectedIndex=SpongeCakeIDX;
	}
}


function ShowResults()
{
	var s="";
	s+="BognortIDX: "+BognortIDX+"\r\n";
	s+="StinkfaceIDX: "+StinkfaceIDX+"\r\n";
	s+="FlargwurmIDX: "+FlargwurmIDX+"\r\n";
	s+="JimIDX: "+JimIDX+"\r\n";
	s+="\r\n";
	s+="GiantMarshmallowIDX: "+GiantMarshmallowIDX+"\r\n";
	s+="BeerScentedTeddyBearIDX: "+BeerScentedTeddyBearIDX+"\r\n";
	s+="GinSoakedBlotterPaperIDX: "+GinSoakedBlotterPaperIDX+"\r\n";
	s+="BoozeSoakedCheeryIDX: "+BoozeSoakedCheeryIDX+"\r\n";
	s+="ComfyPillowIDX: "+ComfyPillowIDX+"\r\n";
	s+="SpongeCakeIDX: "+SpongeCakeIDX+"\r\n";
	alert(s);
}

function LocateSelects()
{
	var aryBandMember=document.getElementsByName("bandmember");
	if(aryBandMember.length>0)
	{		ddBandMember=aryBandMember[0];	}
	
	var aryToGive=document.getElementsByName("togive");
	if(aryToGive.length>0)
	{		ddToGive=aryToGive[0];	}
}
function CheckForBandMates()
{
	if(ddBandMember!=undefined)
	{
		for(var i=0;i<ddBandMember.options.length;i++)
		{
			if(ddBandMember.options[i].text=="Bognort")BognortIDX=i;
			else if(ddBandMember.options[i].text=="Stinkface")StinkfaceIDX=i;
			else if(ddBandMember.options[i].text=="Flargwurm")FlargwurmIDX=i;
			else if(ddBandMember.options[i].text=="Jim")JimIDX=i;
		}
	}
}
function CheckForItems()
{
	if(ddToGive!=undefined)
	{
		for(var i=0;i<ddToGive.options.length;i++)
		{
			if(ddToGive.options[i].text=="giant marshmallow")GiantMarshmallowIDX=i;
			else if(ddToGive.options[i].text=="beer-scented teddy bear")BeerScentedTeddyBearIDX=i;
			else if(ddToGive.options[i].text=="gin-soaked blotter paper")GinSoakedBlotterPaperIDX=i;
			else if(ddToGive.options[i].text=="booze-soaked cherry")BoozeSoakedCheeryIDX=i;
			else if(ddToGive.options[i].text=="comfy pillow")ComfyPillowIDX=i;
			else if(ddToGive.options[i].text=="sponge cake")SpongeCakeIDX=i;
		}
	}
}
