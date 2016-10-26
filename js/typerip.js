function urlEntryKeypress(e_) { //handles the "enter" key in the text entry.
	e_ = e_ || window.event;
	if (e_.keyCode == 13) { //13 is the enter key
		ripFonts();
	}
}

function downloadFont(url_, filename_) {
	var oReq = new XMLHttpRequest();
	
	oReq.onreadystatechange = function(){
		//prompts the user to download the binary blob
		var a = window.document.createElement('a');
		a.href = window.URL.createObjectURL(this.response);
		a.download = filename_;
		document.body.appendChild(a)
		a.click();
		document.body.removeChild(a)		
	}
	
	oReq.open("GET", url_, true);
	oReq.responseType = "blob"
	oReq.send();
}

function ripFonts() {
	//clear font gallery, which lets the user know something is happening...
	document.getElementById('font_gallery').innerHTML = ""
	
	aja()
		.url("https://crossorigin.me/" + document.getElementById('input_url').value)
		.type('html')
		.on('success', function(data){
			//search the data for " {"family":{"slug":" ", this will be the start of the json we need.
			
			json_start = data.search('{"family":{"slug":"'); //search for the first part of the json
			if(json_start == -1) {
				alert("Catastrophic Failure: Unexpected response. Check URL.")
				return;
			}
			
			data = data.substring(json_start);//cut off everything before this point
			
			json_end = data.search('    </script>'); //find the stuff directly after the json, and ues this as the anchor
			if(json_end == -1) {
				alert("Catastrophic Failure: Unexpected response. Check URL.")
				return;
			}
			
			try {
				json = JSON.parse(data.substring(0, json_end)); //extract the json :)
			}catch(e){
				alert("Catastrophic Failure: malformed JSON. Check URL.")
				return;				
			}

			//generate gallery header...
			document.getElementById('font_gallery').innerHTML += "<div class=\"row\"><div class=\"column\" id=\"font_gallery_header\"><span id=\"font_foundry\">" + json.family.foundry.name + "/</span><h2 id=\"font_name\">" + json.family.name + "</h2></div></div>"
			
			//grab global font family info
				var font_primer = json.textSamplePrimers.en;
			
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
				document.getElementById('font_gallery').innerHTML += '<div class=\"row\"><div class=\"column subfont_header\"><a href=\"javascript:downloadFont(\'' + font_url + "\',\'" + json.family.fonts[i].name + ".otf" + '\')\" style="font-family: \'' + json.family.fonts[i].name + '\'" download="' + json.family.fonts[i].name + '.otf">' +  json.family.fonts[i].name + "</a></div></div>";
			}
		})
		.on('error', function(data) {
			alert("Failed to fetch fonts :(");		
		})
		.go();
}