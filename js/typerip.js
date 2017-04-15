function urlEntryKeypress(e_) { 
	/*
	handles the 'enter' key in the text entry.
	*/
	e_ = e_ || window.event;
	if (e_.keyCode == 13) { //13 is the enter key
		ripFonts();
	}
}

function message(text_, error_) {
	/*
	Shows a message to the user in the gallery area.
	If error_ is true, the message is red.
	*/
	if(error_) {
		text_ = "<p style='color:#f00;'>" + text_ + "</p>";
	}else {
		text_ = "<p>" + text_ + "</p>";
	}
	document.getElementById('font_gallery').innerHTML = text_;
}

function downloadFont(url_, fontName_, familyName_) {
	/*
	AJAX requests the font file from TypeKit.
	creates an "a" dom element, setting the href attribute to an object representing the entire font as a blob.
	virtually "clicks" on this "a" element, triggering the download.
	removes the a element.
	*/
	var ajaxRequest = new XMLHttpRequest();
	
	ajaxRequest.onload = function() {
		var element = window.document.createElement('a');
		element.href = window.URL.createObjectURL(ajaxRequest.response);
		element.setAttribute('download', fontName_ + ".otf");
		element.style.display = 'none';
		document.body.appendChild(element)
		element.click();
		document.body.removeChild(element)
	}
	
	ajaxRequest.onerror = function() {
		message("Catastrophic Failure: AJAX error. Failed to download font.", true);
	}

	ajaxRequest.open("GET", url_, true);
	ajaxRequest.responseType = "blob"
	ajaxRequest.send();
}

function ripFonts() {
	/*
	AJAX requests the font family page from TypeKit through a CORS proxy
	extracts the JSON in the page by searching for anchors
	generates a user-viewable gallery for selecting sub-fonts:
		generates a header, with the font foundry, and name of the font family
		generates a clickable download link for each sub-font using data from the JSON
	*/
	
	//clear font gallery, which lets the user know something is happening...
	message("Loading...", false);
	
	var ajaxRequest = new XMLHttpRequest();
	
	ajaxRequest.onload = function() {
		//success
		//search the ajaxRequest.responseText for " {"family":{"slug":" ", this will be the start of the json we need.
		
		var json_start = ajaxRequest.responseText.search('{"family":{"slug":"'); //search for the first part of the json
		if(json_start == -1) {
			message("Catastrophic Failure: Unexpected response. Check URL.", true);

			return;
		}
		
		var data = ajaxRequest.responseText.substring(json_start);//cut off everything before this point
		
		var json_end = data.search('    </script>'); //find the stuff directly after the json, and ues this as the anchor
		if(json_end == -1) {
			message("Catastrophic Failure: Unexpected response. Check URL.", true);
			return;
		}
		
		try {
			json = JSON.parse(data.substring(0, json_end)); //extract the json :)
		}catch(e){
			message("Catastrophic Failure: Unexpected response. Check URL.", true);
			return;				
		}

		//generate gallery header...
		document.getElementById('font_gallery').innerHTML = "<div class=\"row\"><div class=\"column\" id=\"font_gallery_header\"><span id=\"font_foundry\">" + json.family.foundry.name + "/</span><h2 id=\"font_name\">" + json.family.name + "</h2></div></div>"
		
		//grab global font family info
		var font_primer = json.textSampleData.textSamplePrimers.en;
		
		//populate subfonts
		for (i = 0; i < json.family.total_font_count; i++) {
			
			//grab subfont info
			var subfont_web_id = json.family.fonts[i].family.web_id;
			var subfont_fvd = json.family.fonts[i].font.web.fvd;
			var font_url = "https://use.typekit.net/pf/tk/" + subfont_web_id + "/" + subfont_fvd + "/m?primer=" + font_primer +  "&v=2&ec_token=3bb2a6e53c9684ffdc9a9bf71d5b2a620e68abb153386c46ebe547292f11a96176a59ec4f0c7aacfef2663c08018dc100eedf850c284fb72392ba910777487b32ba21c08cc8c33d00bda49e7e2cc90baff01835518dde43e2e8d5ebf7b76545fc2687ab10bc2b0911a141f3cf7f04f3cac438a135f"
			
			//load subfont into CSS
			var newStyle = document.createElement('style');
			newStyle.appendChild(document.createTextNode("@font-face { font-family: '" + json.family.fonts[i].name + "';\src: url(" + font_url + ");}"));
			document.head.appendChild(newStyle);
			
			//use the first font in the family to style the header
			if(i == 0){ document.getElementById('font_name').style.fontFamily = json.family.fonts[i].name; }
			
			//generate a styled link to download each subfont
			document.getElementById('font_gallery').innerHTML += "<div class=\"row\"><div class=\"column subfont_header\"><a href=\"#\" onclick=\"downloadFont(\'" + font_url + "\',\'" + json.family.fonts[i].name + '\', \'' + json.family.name + '\');\" style="font-family: \'' + json.family.fonts[i].name + '">' + json.family.fonts[i].name + "</a></div></div>";
		}		
	}

	ajaxRequest.onerror = function() {
		message("Catastrophic Failure: Initial AJAX error. Check URL.", true);
	}

	
	ajaxRequest.open("GET", "https://crossorigin.me/" + document.getElementById('input_url').value, true);
	ajaxRequest.responseType = "text"
	ajaxRequest.send();
}
