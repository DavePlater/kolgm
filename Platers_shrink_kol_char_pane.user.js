// ==UserScript==
// @name        Plater's shrink kol char pane
// @namespace   com.platertopia.kol
// @description shrink text on charpane
// @include     http://www.kingdomofloathing.com/charpane.php
// @version     1
// @grant       none
// ==/UserScript==


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


var uppersection_xp="/html/body/center[2]/table"
var uppersection_result=findSet(uppersection_xp);
for (var i = 0; i < uppersection_result.snapshotLength; i++) { uppersection_result.snapshotItem(i).style.fontSize ="12px"; }

var oAvatarImage=find("//a[@class='nounder']/img");
ShrinkImage(oAvatarImage,50,50);

var img_find = document.getElementsByTagName("img");
for(var i=0;i<img_find.length;i++)
{
    ShrinkImage(img_find[i],56,56);
    /*
    //a[@class='nounder']/img			//if(img_find[i].src.indexOf("warfratoutfit")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}
    if(img_find[i].src.indexOf("horde")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//hore
    if(img_find[i].src.indexOf("extmeter")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//excitement	
    if(img_find[i].src.indexOf("bigbike")!=-1){img_find[i].style.width="56px";img_find[i].style.height="50px";}//AoSP's motorcycle
    if(img_find[i].src.indexOf("jarlcomp")!=-1){img_find[i].style.width="25px";img_find[i].style.height="25px";}//AoJ's companions
*/
}

