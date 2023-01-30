var TypeRip = {
    handleRequest: function(url_, callback_){
        if(!url_.toLowerCase().startsWith("http://") && !url_.toLowerCase().startsWith("https://")){
            url_ = "http://" + url_;
        }
        if(url_.indexOf("fonts.adobe.com/collections") != -1){
            this.getFontCollection(url_, callback_);
        }else{
            this.getFontFamily(url_, callback_);
        }
    },

    getFontCollection: function(url_, callback_){
        axios.get("https://api.allorigins.win/raw?url=" + url_)
        .then(function (response) {
            let fontCollection = {
                name: "",
                designers: [],
                fonts: []
            }

            //search for the first part of the json
            let json_start = response.data.toString().search('{"fontpack":{"all_valid_slugs":'); 
		    if(json_start == -1) {
                callback_("error", "Unexpected response from server. You either mistyped the URL, or the CORS proxy is down.")
                return
            }

            //cut off everything before this point
            let data = response.data.substring(json_start)

            //find the stuff directly after the json, and use this as the anchor    
            let json_end = data.search('</script>') 
            if(json_end == -1) {
                callback_("error", "Catastrophic Failure 002: Unexpected response. Check URL.")
                return
            }

            //parse the json blob
            let json;
            try {
                json = JSON.parse(data.substring(0, json_end)); 
            }catch(e){
                callback_("error",  "Catastrophic Failure 003: Unexpected response. Check URL.")
                return
            }

            //find the default language of the first font in this collection.
            fontCollection.defaultLanguage = json.fontpack.font_variations[0].default_language;

            //grab the sample text data for this language
            fontCollection.sampleText = json.textSampleData.textSamples[fontCollection.defaultLanguage]["list"]; 
            
            //Font collection name
            fontCollection.name = json.fontpack.name

            //Find the contributor who curated this collection:
            fontCollection.designers.push({
                "name": json.fontpack.contributor_credit,
                "url": url_
            })
            
            //populate subfonts
            for (let i = 0; i < json.fontpack.font_variations.length; i++) {
                fontCollection.fonts.push({
                    url: "https://use.typekit.net/pf/tk/" + json.fontpack.font_variations[i].opaque_id + "/" + json.fontpack.font_variations[i].fvd + "/a?unicode=AAAAAQAAAAEAAAAB&features=ALL&v=3&ec_token=3bb2a6e53c9684ffdc9a9bf71d5b2a620e68abb153386c46ebe547292f11a96176a59ec4f0c7aacfef2663c08018dc100eedf850c284fb72392ba910777487b32ba21c08cc8c33d00bda49e7e2cc90baff01835518dde43e2e8d5ebf7b76545fc2687ab10bc2b0911a141f3cf7f04f3cac438a135f", 
                    name: json.fontpack.font_variations[i].full_display_name,
                    style: json.fontpack.font_variations[i].variation_name, 
                    familyName: json.fontpack.font_variations[i].family.name,
                    familyUrl: "https://fonts.adobe.com/fonts/" + json.fontpack.font_variations[i].family.slug
                });
            }	

            callback_("success", fontCollection)
        })
        .catch(function (error) {
            callback_("error", error.message)
        })
    },

    getFontFamily: function(url_, callback_) {
        axios.get("https://api.allorigins.win/raw?url=" + url_)
        .then(function (response) {
            let fontFamily = {
                name: "",
                designers: [],
                fonts: []
            }

            //search for the first part of the json
            let json_start = response.data.toString().search('{"family":{"slug":"'); 
		    if(json_start == -1) {
                callback_("error", "Unexpected response from server. You either mistyped the URL, or the CORS proxy is down.")
                return
            }

            //cut off everything before this point
            let data = response.data.substring(json_start)

            //find the stuff directly after the json, and use this as the anchor    
            let json_end = data.search('</script>') 
            if(json_end == -1) {
                callback_("error", "Catastrophic Failure 002: Unexpected response. Check URL.")
                return
            }

            //parse the json blob
            let json;
            try {
                json = JSON.parse(data.substring(0, json_end));
            }catch(e){
                callback_("error",  "Catastrophic Failure 003: Unexpected response. Check URL.")
                return
            }

            //find the default language of this font
            fontFamily.defaultLanguage = json.family.display_font.default_language;

            //grab the sample text data for this language
            fontFamily.sampleText = json.textSampleData.textSamples[fontFamily.defaultLanguage]["list"]; 
            
            //family/foundry names
            fontFamily.foundryName = json.family.foundry.name;
            fontFamily.name = json.family.name
            fontFamily.slug = json.family.slug

            //designers
            for(let i = 0; i < json.family.designers.length; i++) {
                let designer = {}
                designer["name"] = json.family.designers[i].name

                if(json.designer_info[json.family.designers[i].slug] != null){
                    designer["url"] = "https://fonts.adobe.com" + json.designer_info[json.family.designers[i].slug].url
                }

                fontFamily.designers.push(designer)
            }

            //populate subfonts
            for (let i = 0; i < json.family.fonts.length; i++) {
                fontFamily.fonts.push({
                    //the magic is in the "unicode=AAAAAQAAAAEAAAAB&features=ALL&v=3"m which (apparently) requests the entire font set from the server :)
                    url: "https://use.typekit.net/pf/tk/" + json.family.fonts[i].family.web_id + "/" + json.family.fonts[i].font.web.fvd + "/a?unicode=AAAAAQAAAAEAAAAB&features=ALL&v=3&ec_token=3bb2a6e53c9684ffdc9a9bf71d5b2a620e68abb153386c46ebe547292f11a96176a59ec4f0c7aacfef2663c08018dc100eedf850c284fb72392ba910777487b32ba21c08cc8c33d00bda49e7e2cc90baff01835518dde43e2e8d5ebf7b76545fc2687ab10bc2b0911a141f3cf7f04f3cac438a135f", 
                    name: json.family.fonts[i].name,
                    style: json.family.fonts[i].variation_name, 
                    familyName: json.family.fonts[i].preferred_family_name,
                    familyUrl: "https://fonts.adobe.com/fonts/" + json.family.slug
                });
            }	
            callback_("success", fontFamily)
        })
        .catch(function (error) {
            callback_("error", error.message)
        })
    },
    downloadFonts: function(fonts_, zipFileName_, rawDownload_){
        fontList = []
        if(Array.isArray(fonts_)){ //more than one font
            fontList = fonts_;
        }else{ //only one font
            fontList = [fonts_];
            zipFileName_ = fonts_.name + " " + fonts_.style
        }

        //create a ZIP file
        zip = new JSZip();

        fontProcessCounter = 0;

        //go through each instance of fond information in fontList, download them from the adobe server, reconstruct them with OpenType and zip them.
        //Once n fonts have been zipped, download the zip file, where n is the number of fonts in fontList.
        //There's probably a better way to do this with promises or something.
        for(var i = 0; i < fontList.length; i++) {
            var fontData = this.getAndRepairFont(fontList[i], rawDownload_, (font, fontMeta) =>{
                zip.file(fontMeta.name + ".ttf", font);
                fontProcessCounter++;
                if(fontProcessCounter == fontList.length){
                    zip.generateAsync({type:"blob"})
                    .then(function(content) {
                        saveAs(content, zipFileName_ + ".zip");
                    });
                }
            });
        }
    },

    getAndRepairFont: function(font_, rawDownload_, callback_) {
        if(rawDownload_){
            axios.get(font_.url, {responseType: 'arraybuffer'}).then(function (response) {
                callback_(response.data, font_);
            });

        }else{
            opentype.load(font_.url, function(error_, fontData_) {
                if (error_) {
                    return "Error: Font failed to load."
                }else{

                    //Rebuild the glyph data structure. This repairs any encoding issues.
                    let rebuiltGlyphs = []

                    //for every glyph in the parsed font data:
                    for(let i = 0; i < fontData_.glyphs.length; i++) {
                        //Create a structure to hold the new glyph data
                        let glyphData = {};

                        let glyphFields = ['name', 'unicode', 'unicodes', 'path', 'index', 'advanceWidth', 'leftSideBearing']

                        glyphFields.forEach(field => {
                            if(fontData_.glyphs.glyphs[i][field] != null) {
                                glyphData[field] = fontData_.glyphs.glyphs[i][field]
                            }
                        });

                        //HOTFIX #1     If the advanceWidth of a glyph is NaN, opentype will crash.
                        //SOLUTION:     Ensure advanceWidth has non-NaN AND non-0 value
                        if(glyphData.advanceWidth == null || isNaN(glyphData.advanceWidth)){
                            let newAdvanceWidth = Math.floor(fontData_.glyphs.glyphs[i].getBoundingBox().x2);
                            if(newAdvanceWidth == 0){
                                newAdvanceWidth = fontData_.glyphs.glyphs[0].getBoundingBox().x2;
                            }
                            glyphData.advanceWidth = newAdvanceWidth;
                        }

                        //Rebuild the new glyph.
                        let rebuiltGlyph = new opentype.Glyph(glyphData);

                        //HOTFIX #2:    If fields with a value of 0 are used in the constructor, opentype will simply not set them in the object.
                        //SOLUTION:     Manually go through every 0 field that should have been set in the constructor, and set it. ( https://github.com/opentypejs/opentype.js/issues/375 )
                        glyphFields.forEach(field => {
                            if(glyphData[field] != null && glyphData[field] == 0) {
                                rebuiltGlyph[field] = 0
                            }
                        })

                        //push the rebuilt glyph to an array.
                        rebuiltGlyphs.push(rebuiltGlyph)
                    }
                    
                    //create a structure of font data with fields from the parsed font.
                    let newFontData = {
                        familyName: font_.familyName,
                        styleName: font_.style,
                        glyphs: rebuiltGlyphs
                    }

                    //extract as much available data out of the existing font data and copy it over to the new font:
                    let optionalFontDataFields = ['defaultWidthX', 'nominalWidthX', 'unitsPerEm', 'ascender', 'descender' ]
                    optionalFontDataFields.forEach(field => {
                        if(fontData_[field] != null) {
                            newFontData[field] = fontData_[field]
                        }
                    });

                    //rebuild and download the font.
                    let newFont = new opentype.Font(newFontData)
                    callback_(newFont.toArrayBuffer(), font_);
                }
            })
        }
    }
}

