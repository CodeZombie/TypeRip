function ripFonts(url_, vue_, callback_) {
	/*
	AJAX requests the font family page from TypeKit through a CORS proxy
	extracts the JSON in the page by searching for anchors
	generates a user-viewable gallery for selecting sub-fonts:
		generates a header, with the font foundry, and name of the font family
		generates a clickable download link for each sub-font using data from the JSON
	*/	
	var ajaxRequest = new XMLHttpRequest();
	
	ajaxRequest.onload = function() {

        var output = {foundryname: "", familyname: "", fonts: []};
		//success
		//search the ajaxRequest.responseText for " {"family":{"slug":" ", this will be the start of the json we need.
		
		var json_start = ajaxRequest.responseText.search('{"family":{"slug":"'); //search for the first part of the json
		if(json_start == -1) {
            callback_({error: true, message: "Catastrophic Failure: Unexpected response. Check URL."}, vue_);
            return;
        }
		
		var data = ajaxRequest.responseText.substring(json_start);//cut off everything before this point
		
		var json_end = data.search('    </script>'); //find the stuff directly after the json, and ues this as the anchor
		if(json_end == -1) {
            callback_({error: true, message: "Catastrophic Failure: Unexpected response. Check URL."}, vue_);
            return;
		}
		
		try {
			json = JSON.parse(data.substring(0, json_end)); //extract the json :)
		}catch(e){
            callback_({error: true, message: "Catastrophic Failure: Unexpected response. Check URL."}, vue_);
            return;		
		}
		
		console.log(json);
        
        output.foundryname = json.family.foundry.name;
        output.familyname = json.family.name
		
		//grab global font family info...
		var font_primer = json.textSampleData.textSamplePrimers.en;
		//populate subfonts
		for (i = 0; i < json.family.total_font_count; i++) {
			//grab subfont info...
			var subfont_web_id = json.family.fonts[i].family.web_id;
			var subfont_fvd = json.family.fonts[i].font.web.fvd;
			var font_url = "https://use.typekit.net/pf/tk/" + subfont_web_id + "/" + subfont_fvd + "/m?primer=" + font_primer +  "&v=2&ec_token=3bb2a6e53c9684ffdc9a9bf71d5b2a620e68abb153386c46ebe547292f11a96176a59ec4f0c7aacfef2663c08018dc100eedf850c284fb72392ba910777487b32ba21c08cc8c33d00bda49e7e2cc90baff01835518dde43e2e8d5ebf7b76545fc2687ab10bc2b0911a141f3cf7f04f3cac438a135f";
            output.fonts.push({url: font_url, name: json.family.fonts[i].name , foundry_name: json.family.foundry.name, foundry_slug: json.family.foundry.slug, type: json.family.fonts[i].font.web.type});
        }		
        callback_({data: output, error: false}, vue_);
	}

	ajaxRequest.onerror = function() {
        callback_({error: true, message: "Catastrophic Failure: Unexpected response. Check URL."}, vue_);
        return;
	}

	ajaxRequest.open("GET", "https://cors-anywhere.herokuapp.com/" + url_, true);
	ajaxRequest.responseType = "text"
	ajaxRequest.send();
}

function downloadFont(url_, fontName_, type_) {
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
		element.setAttribute('download', fontName_ + "." + type_);
		element.style.display = 'none';
		document.body.appendChild(element)
		element.click();
		document.body.removeChild(element)
	}
	
	ajaxRequest.onerror = function() {
		// fill this in.
	}

	ajaxRequest.open("GET", url_, true);
	ajaxRequest.responseType = "blob"
	ajaxRequest.send();
}