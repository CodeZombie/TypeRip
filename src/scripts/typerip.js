import axios from 'axios';
import saveAs from 'file-saver';
import ltag_module from 'opentype.js/src/tables/ltag.js'
import name_module from 'opentype.js/src/tables/name.js'
import head_module from 'opentype.js/src/tables/head.js'
import 'https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js';
//import woff2otf from 'woff2otf';
import sfnt_module from 'opentype.js/src/tables/sfnt.js';


class Table {
    constructor(font_dataview, table_directory_offset) {
        this.table_directory_offset = table_directory_offset;
        this.name = Table.getTableName(font_dataview, table_directory_offset);
        this.checksum = font_dataview.getUint32(table_directory_offset + 4);
        this.offset = font_dataview.getUint32(table_directory_offset + 8);
        this.length = font_dataview.getUint32(table_directory_offset + 12);
        //this.data = font_dataview.slice(this.offset, this.offset + this.length);
    }


    updateChecksum(font_dataview){
        var new_checksum = sfnt_module.computeCheckSum([].slice.call(new Uint8Array(font_dataview.buffer)).slice(this.offset, this.offset + this.length));
        font_dataview.setUint32(this.table_directory_offset + 4, new_checksum);
    }

    setOffset(font_dataview, new_offset){
        font_dataview.setUint32(this.table_directory_offset + 8, new_offset);
        this.offset = new_offset;
    }

    setLength(font_dataview, new_length) {
        font_dataview.setUint32(this.table_directory_offset + 12, new_length);
        this.length = new_length;
    }

    static pad(num){
        while(num % 4 != 0){
            num++
        }
        return num
    }


    static getTableName(font_dataview, offset_subtable_name_offset) {
        var name = '';
        for (let i = offset_subtable_name_offset; i < offset_subtable_name_offset + 4; i += 1) {
            name += String.fromCharCode(font_dataview.getInt8(i));
        }
        return name
    }
}

export default class TypeRip {
    static URLTypes = Object.freeze({
        Invalid: 0,
        FontFamily: 1,
        FontCollection: 2
    });

    static ResponseTypes = Object.freeze({
        Success: 0,
        Error: 1
    });

    static prependHttpsToURL(url) {
        if (!url.toLowerCase().startsWith("http://") && !url.toLowerCase().startsWith("https://")) {
            url = "https://" + url;
        }
        return url
    }

    static getURLType(url){
        if(url.indexOf("fonts.adobe.com/collections") != -1){
            return this.URLTypes.FontCollection;
        }else if(url.indexOf("fonts.adobe.com/fonts") != -1){
            return this.URLTypes.FontFamily;
        }else{
            return this.URLTypes.Invalid;
        }
    }

    static doesCacheEntryExist(url){
        return localStorage.getItem(url) != null
    }

    static getCacheEntry(url){
        return JSON.parse(localStorage.getItem(url))
    }

    static setCacheEntry(url, data){
        localStorage.setItem(url, JSON.stringify(data))
    }

    static getFontCollection(url_, callback_){

        if (this.doesCacheEntryExist(url_)) {
            callback_(this.ResponseTypes.Success, this.getCacheEntry(url_))
            return
        }

        axios.get("https://api.allorigins.win/raw?url=" + url_)
        .then((response) => {
            let fontCollection = {
                name: "",
                designers: [],
                fonts: []
            }

            //search for the first part of the json
            let json_start = response.data.toString().search('{"fontpack":{"all_valid_slugs":'); 
		    if(json_start == -1) {
                callback_(this.ResponseTypes.Error, "Unexpected response from server. You either mistyped the URL, or the CORS proxy is down.")
                return
            }

            //cut off everything before this point
            let data = response.data.substring(json_start)

            //find the stuff directly after the json, and use this as the anchor    
            let json_end = data.search('</script>') 
            if(json_end == -1) {
                callback_(this.ResponseTypes.Error, "Catastrophic Failure 002: Unexpected response. Check URL.")
                return
            }

            //parse the json blob
            let json;
            try {
                json = JSON.parse(data.substring(0, json_end)); 
            }catch(e){
                callback_(this.ResponseTypes.Error,  "Catastrophic Failure 003: Unexpected response. Check URL.")
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
                var scrape_method = 'd'//'l'
                fontCollection.fonts.push({
                    id_a: json.fontpack.font_variations[i].opaque_id,
                    id_b: json.fontpack.font_variations[i].fvd,
                    name: json.fontpack.font_variations[i].full_display_name,
                    style: json.fontpack.font_variations[i].variation_name, 
                    familyName: json.fontpack.font_variations[i].family.name,
                    familyUrl: "https://fonts.adobe.com/fonts/" + json.fontpack.font_variations[i].family.slug
                });
            }	
            this.setCacheEntry(url_, fontCollection)
            callback_(this.ResponseTypes.Success, fontCollection)
        })
        .catch( (error) => {
            callback_(this.ResponseTypes.Error, error.message)
        })
    }

    static getFontFamily(url_, callback_) {

        if (this.doesCacheEntryExist(url_)) {
            callback_(this.ResponseTypes.Success, this.getCacheEntry(url_))
            return
        }

        axios.get("https://api.allorigins.win/raw?url=" + url_)
        .then((response) => {
            let fontFamily = {
                name: "",
                designers: [],
                fonts: []
            }

            //search for the first part of the json
            let json_start = response.data.toString().search('{"family":{"slug":"'); 
		    if(json_start == -1) {
                callback_(this.ResponseTypes.Error, "Unexpected response from server. You either mistyped the URL, or the CORS proxy is down.")
                return
            }

            //cut off everything before this point
            let data = response.data.substring(json_start)

            //find the stuff directly after the json, and use this as the anchor    
            let json_end = data.search('</script>') 
            if(json_end == -1) {
                callback_(this.ResponseTypes.Error, "Catastrophic Failure 002: Unexpected response. Check URL.")
                return
            }

            //parse the json blob
            let json;
            try {
                json = JSON.parse(data.substring(0, json_end));
            }catch(e){
                callback_(this.ResponseTypes.Error,  "Catastrophic Failure 003: Unexpected response. Check URL.")
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
                    id_a: json.family.fonts[i].family.web_id,
                    id_b: json.family.fonts[i].font.web.fvd,
                    name: json.family.fonts[i].name,
                    style: json.family.fonts[i].variation_name, 
                    familyName: json.family.fonts[i].preferred_family_name,
                    familyUrl: "https://fonts.adobe.com/fonts/" + json.family.slug,
                    defaultLanguage: fontFamily.defaultLanguage,
                    sampleText: fontFamily.sampleText
                });
            }	
            this.setCacheEntry(url_, fontFamily)
            callback_(this.ResponseTypes.Success, fontFamily)
        })
        .catch((error) => {
            callback_(this.ResponseTypes.Error, error.message)
        })
    }

    //TrueType: https://fonts.adobe.com/fonts/sole-serif-variable
    //OpenType: https://fonts.adobe.com/fonts/paroli
    // doesnt work? https://fonts.adobe.com/fonts/altivo



    // TFF ENCODING/DECODING

    // static getTableOffset(font_dataview, table_name) {
    //     var number_of_tables = font_dataview.getUint16(4);
    //     for(let i = 12; i <= (12 + number_of_tables * 16); i += 16) {
    //         if(this.getTableName(font_dataview, i) == table_name){
    //             return i;
    //         }
    //     }
    //     throw new Error("Could not find table " + table_name);
    // }

    // static getTableName(dataView, offset) {
    //     let tag = '';
    //     for (let i = offset; i < offset + 4; i += 1) {
    //         tag += String.fromCharCode(dataView.getInt8(i));
    //     }
    //     return tag;
    // }

    static getTables(font_dataview) {
        var table_count = font_dataview.getUint16(4);
        var tables = [];
        for(let i = 12; i < (12 + table_count * 16); i += 16) {
            tables.push(new Table(font_dataview, i));
        }
        return tables
    }

    static getTable(font_dataview, table_name) {
        var tables = this.getTables(font_dataview);
        return tables.find(function(table) { return table.name === table_name; });
    }

    // static applyOffsetDelta(font_dataview, start_table_name, offset_delta) {
    //     // Will update the offsets of all entries in the `offset subtable` that are positioned after `start_table_name` by `offset_delta`
    //     var table_count = font_dataview.getUint16(4);
    //     var start_table = this.getTable(font_dataview, start_table_name);
        
    //     //for every entry in The Offset Subtable
    //     for(let i = 12; i < (12 + (table_count * 16)); i += 16) { // TODO: < or <= ?????
    //         var table_offset = font_dataview.getUint32(i + 8);
    //         if(table_offset >= start_table.offset) {
    //             console.log(`Updating ${Table.getTableName(font_dataview, i)}'s offset from ${table_offset} to ${table_offset + offset_delta}`);
    //             font_dataview.setUint32(i + 8, table_offset + offset_delta)
    //         }
    //     }
    // }

    // static updateTablesChecksum(font_dataview, table_name) {
    //     var checksum = sfnt_module.computeCheckSum(new Uint8Array(encoded_table))
    //     new Uint8Array(data_before_original_table.byteLength)
    //     new_font_dataview.setUint32(i + 4, checksum)
    // }

    static insertEncodedTableIntoFontDataview(font_dataview, encoded_table, table_name) {
        var table = this.getTable(font_dataview, table_name);
        if (!table){
            throw new Error("Could not find table " + table_name);
        }
        var original_table_length = table.length;
        while (original_table_length % 4 != 0) {
            original_table_length++
        }
        console.log(`${table_name}.offset=${table.offset}`)
        console.log(`${table_name}.length=${table.length}. Adjust for alignment: ${original_table_length}`)

        //table.setLength(font_dataview, encoded_table_prepadded_length);
        // Pad the encoded table to four-byte alignment
        while (encoded_table.length % 4 != 0) {
            console.log("padding table...")
            encoded_table.push(0);
        }
        console.log("First value of data after table: " + new Uint8Array(font_dataview.buffer).slice(table.offset + table.length, table.offset + table.length + 8))

        var data_before_original_table = font_dataview.buffer.slice(0, table.offset);
        var new_table_buffer = new Uint8Array(encoded_table).buffer;
        var data_after_original_table = font_dataview.buffer.slice(table.offset + original_table_length);

        var updated_font_uint8array = new Uint8Array(data_before_original_table.byteLength + new_table_buffer.byteLength + data_after_original_table.byteLength);

        updated_font_uint8array.set(new Uint8Array(data_before_original_table), 0); // Insert data before table
        updated_font_uint8array.set(new Uint8Array(new_table_buffer), data_before_original_table.byteLength); // Insert table
        updated_font_uint8array.set(new Uint8Array(data_after_original_table), data_before_original_table.byteLength + new_table_buffer.byteLength); // Insert data after table

        font_dataview = new DataView(updated_font_uint8array.buffer);
        //console.log("First value of data after table after shit: " + new Uint8Array(font_dataview.buffer).slice(table.offset + encoded_table.length, table.offset + encoded_table.length + 8))
        var encoded_table_postpad_length = new Uint8Array(encoded_table).buffer.byteLength;
        //Now go through every table listed after this table and update it's offset accordingly.

        var new_table_size_delta = encoded_table_postpad_length - original_table_length;

        this.getTables(font_dataview).forEach(t => {
            
            if (t.offset > table.offset){
                console.log(`Table['${t.name}'] original offset=${t.offset}`)
                console.log(`Applying offset of ${new_table_size_delta} to ${t.name} to set the offset to ${t.offset + new_table_size_delta}`);
                t.setOffset(font_dataview, t.offset + new_table_size_delta);
            }
        });

        

        console.log("post apply POST table offset: " + this.getTable(font_dataview, "post").offset)
        //console.log("Post applyOffsetDelta checksum: " + String(sfnt_module.computeCheckSum([].slice.call(new Uint8Array(font_dataview.buffer)))));
        
        return font_dataview;
    }

    static updateFontNameTable2(font_dataview, family_name, subfamily_name, full_name, post_script_name) {
        // Get the LTAG table, if it's available.
        var parsed_ltag_table = undefined;
        var ltag_table = this.getTable(font_dataview, 'ltag');
        if (ltag_table) {
            console.log("Found ltag")
            
            parsed_ltag_table = ltag_module.parse(font_dataview, ltag_table.offset);
            console.log(parsed_ltag_table)
        }

        var name_table = this.getTable(font_dataview, 'name');
        if (!name_table){
            throw new Error("Could not find name table");
        }

        // Rename the entries in the name table.
        let parsed_name_table = name_module.parse(font_dataview, name_table.offset, parsed_ltag_table);
        console.log(parsed_name_table.fontFamily)
        console.log(`fontFamily: ${parsed_name_table.fontFamily.en} -> ${family_name}`)
        console.log(`fontSubfamily: ${parsed_name_table.fontSubfamily.en} -> ${subfamily_name}`)
        console.log(`fullName: ${parsed_name_table.fullName.en} -> ${full_name}`)
        console.log(`postScriptName: ${parsed_name_table.postScriptName.en} -> ${post_script_name}`)

        parsed_name_table.fontFamily.en = family_name
        parsed_name_table.fontSubfamily.en = subfamily_name
        parsed_name_table.fullName.en = full_name
        parsed_name_table.postScriptName.en = post_script_name

        var encoded_name_table = name_module.make(parsed_name_table, parsed_ltag_table).encode()

        font_dataview = this.insertEncodedTableIntoFontDataview(font_dataview, encoded_name_table, 'name');
        name_table.updateChecksum(font_dataview);

        // Pad the whole font to four-byte alignment (??? Do we need to do this????)
        var font_uint8array = [].slice.call(new Uint8Array(font_dataview.buffer));
        // while (font_uint8array.length % 4 != 0) {
        //     console.log("Padding")
        //     font_uint8array.push(0);
        // }
        font_uint8array = new Uint8Array(font_uint8array)
        font_dataview = new DataView(font_uint8array.buffer, font_uint8array.byteOffset, font_uint8array.byteLength);

        // Set the head table's `checkSumAdjustment` field to 0.
        var head_table = this.getTable(font_dataview, 'head');
        font_dataview.setUint32(head_table.offset + 8, 0);

        // Calculate and update the entire font's checkSumAdjustment
        var font_data_array = [].slice.call(new Uint8Array(font_dataview.buffer));
        var checksum = 0xB1B0AFBA - sfnt_module.computeCheckSum(font_data_array);
        font_dataview.setUint32(head_table.offset + 8, checksum);

        return font_dataview;
    }

    static updateFontNameTable(font_dataview, family_name, subfamily_name, full_name, post_script_name) {
        // read the SFNTVERSION from the first uint32 in the file:
        var sfntVersion = font_dataview.getUint32(0);
        var font_type = "unknown"
        var num_tables = font_dataview.getUint16(4);
    
        if (sfntVersion == 1330926671){ // 'OTTO' - OpenType
            font_type = "opentype"

        }else if(sfntVersion == 65536){ // 'Truetype'
            font_type = "truetype"
        }

        if (font_type == "unknown") {
            throw new Error("Font type not supported")
        }

        // Read all the table entries from the table directory.
        var tables = this.getTables(font_dataview);
        console.log("Found " + tables.length + " tables.")

        //find the `ltag` table if it exists
        var ltagTable = table_entries.find(function(entry) { return entry.name === 'ltag'; });
        let parsedLtagTable = undefined;
        if (ltagTable) {
            parsedLtagTable = ltag_module.parse(font_dataview, ltagTable.offset);
            console.log("Found LTAG Table.")
        }

        //find the `name` table.
        var nameTable = table_entries.find(function(entry) { return entry.name === 'name'; })
        if (!nameTable) { throw new Error("Name table not found"); }

        var original_name_table_offset = nameTable.offset
        var original_name_table_length = nameTable.length

        let parsedNameTable = name_module.parse(font_dataview, nameTable.offset, parsedLtagTable);

        parsedNameTable.fontFamily.en = "T_FF_T_" + family_name
        parsedNameTable.fontSubfamily.en = "T_FSF_T_" + subfamily_name
        parsedNameTable.fullName.en = "T_FN_T_" + full_name
        parsedNameTable.postScriptName.en = "T_PSN_T_" + post_script_name

        var encoded_name_table = name_module.make(parsedNameTable, parsedLtagTable).encode()
        // Pad the name table.
        while (encoded_name_table.length % 4 != 0) {
            encoded_name_table.push(0)
        }
        //console.log(name_module.parse(new DataView(new Uint8Array(encoded_name_table).buffer), 0, parsedLtagTable))
        //console.log("B")
        //encoded_name_table = [].slice.call(new Uint8Array(font_dataview.buffer.slice(original_name_table_offset, original_name_table_offset + original_name_table_length)))


        var new_name_table_size_difference = encoded_name_table.length - original_name_table_length

        // remove the original name table and insert the new one
        var new_font_uint8array_chunks = []
        new_font_uint8array_chunks.push(font_dataview.buffer.slice(0, original_name_table_offset))
        new_font_uint8array_chunks.push(this.typedArrayToBuffer(new Uint8Array(encoded_name_table)))
        new_font_uint8array_chunks.push(font_dataview.buffer.slice(original_name_table_offset + original_name_table_length))
        var new_font_uint8array = new Uint8Array(new_font_uint8array_chunks[0].byteLength + new_font_uint8array_chunks[1].byteLength + new_font_uint8array_chunks[2].byteLength);
        new_font_uint8array.set(new Uint8Array(new_font_uint8array_chunks[0]));
        new_font_uint8array.set(new Uint8Array(new_font_uint8array_chunks[1]), new_font_uint8array_chunks[0].byteLength);
        new_font_uint8array.set(new Uint8Array(new_font_uint8array_chunks[2]), new_font_uint8array_chunks[0].byteLength + new_font_uint8array_chunks[1].byteLength);
        var new_font_dataview = new DataView(new_font_uint8array.buffer);

        

        // Go through the table directory and update all the offsets for every table that appears after the name table, and then update the name table's checksum
        var found_name_table = false
        for(let i = 12; i < (12 + num_tables * 16); i += 16) {
            var tableName = this.getTableName(font_dataview, i);
            var table_offset = new_font_dataview.getUint32(i + 8 );
            if (table_offset > original_name_table_offset) {
                new_font_dataview.setUint32(i + 8, table_offset + new_name_table_size_difference);
            }

            // Get the name of this table
            var tableName = this.getTableName(font_dataview, i);

            if (tableName === 'name') {

                //update the name table's length 
                new_font_dataview.setUint32(i + 12, new_font_uint8array_chunks[1].byteLength);

                //update the name table's checksum
                var checksum = sfnt_module.computeCheckSum([].slice.call(new Uint8Array(new_font_uint8array_chunks[1])))
                new_font_dataview.setUint32(i + 4, checksum)
            }
        }

        //pad the font out to a multiple of 4
        var font_data_array = [].slice.call(new_font_uint8array)
        while (font_data_array.length % 4 != 0) {
            console.log("Added 0 to whole font")
            font_data_array.push(0)
        }
        new_font_dataview = new DataView(this.typedArrayToBuffer(new Uint8Array(font_data_array)))

        // Now update the entire font's checksum
        for(let i = 12; i < (12 + num_tables * 16); i += 16) {
            if (this.getTableName(font_dataview, i) === 'head') {
                console.log("UPDATING CHECKSUM")
                // get head table offset
                var headTableOffset = new_font_dataview.getUint32(i + 8);
                // set the checksumAdjustment field to zero
                new_font_dataview.setUint32(headTableOffset + 8, 0);
                font_data_array = [].slice.call(new Uint8Array(new_font_dataview.buffer))
                var checksum = 0xB1B0AFBA - sfnt_module.computeCheckSum(font_data_array)
                new_font_dataview.setUint32(headTableOffset + 8, checksum)
                console.log("NEW CHECKSUM: " + new_font_dataview.getUint32(headTableOffset + 8))
            }
        }

        // for(let i = 12; i < num_tables * 16; i += 16) {
        //     var table_name = this.getTableName(font_dataview, i);
        //     var table_checksum = font_dataview.getUint32(i + 4);
        //     var table_offset = font_dataview.getUint32(i + 8);
        //     var table_length = font_dataview.getUint32(i + 12);


        // var parser = new TableParser(font_dataview, nameTable.offset);
        // var format = parser.getValue(2, false);
        // var count = parser.getValue(2, false);
        // var string_offset = nameTable.offset + parser.getValue(2, false);
        // name_entry = []
        // for (let i = 0; i < count; i++) {
        //     var platform_id = parser.getValue(2, false);
        //     var encodingID = parser.getValue(2, false);
        //     var languageID = parser.getValue(2, false);
        //     var nameID = parser.getValue(2, false);
        //     var byteLength = parser.getValue(2, false);
        //     var offset = parser.getValue(2, false);
        //     var language = parser.getValue(2, false);
        //     var encoding = parser.getValue(2, false);
        //     var platformName = parser.getValue(2, false);
        //}

        console.log(new_font_dataview)
        return new_font_dataview

    }

    static typedArrayToBuffer(typedArray) {
        return typedArray.buffer.slice(typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength);
    }

    static async downloadFontsAsZip(fonts, zipfile_name){
        for(var i = 0; i < fonts.length; i++) {
            var file = await this.getFontFile(fonts[i])
            // var opentype_font = opentype.parse(file)
            // console.log("NAMES:")
            // console.log(opentype_font.names.fontFamily)
            // console.log(opentype_font.names.fontSubfamily)
            
            // opentype_font.names.fontFamily.en = fonts[i].familyName
            // opentype_font.names.fontSubfamily.en = fonts[i].style
            // opentype_font.names.fullName.en = fonts[i].familyName + " " + fonts[i].style
            // opentype_font.names.postScriptName.en = String(fonts[i].familyName + " " + fonts[i].style).replaceAll(' ', '-')
            // //opentype_font.names.style.fontSubfamily.en = fonts[i].style
            // console.log(opentype_font)
            // opentype_font.download()
            var renamed_font_file_dataview = this.updateFontNameTable2(new DataView(this.typedArrayToBuffer(file)), fonts[i].familyName, fonts[i].style, fonts[i].name, fonts[i].name.replaceAll(' ', '-'))

            saveAs(new Blob([renamed_font_file_dataview.buffer]), fonts[i].name + ".OTF");

        }
    }

    static async convertWoff2ToTTF(woff2Uint8ArrayBuffer) {
        const loadScript = (src) => new Promise((onload) => document.documentElement.append(
            Object.assign(document.createElement('script'), {src, onload})
          ));
        if (!window.Module) {
            const path = 'https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js'
            const init = new Promise((done) => window.Module = { onRuntimeInitialized: done});
            await loadScript(path).then(() => init);
        }

        return Module.decompress(woff2Uint8ArrayBuffer)
    }

    static getFontURL(font) {
        //a (hyphen name, install locked, ttf/otf)
        //j (hash name, installable, ttf/otf)
        //d is (right name, installable, woff wrap of ttf/otf)
        //l is (right name, installable, woff2 wrap of ttf/otf)
        var scrape_method = 'l'
        return "https://use.typekit.net/pf/tk/" + font.id_a + "/" + font.id_b + "/" + scrape_method + "?unicode=AAAAAQAAAAEAAAAB&features=ALL&v=3&ec_token=3bb2a6e53c9684ffdc9a9bf71d5b2a620e68abb153386c46ebe547292f11a96176a59ec4f0c7aacfef2663c08018dc100eedf850c284fb72392ba910777487b32ba21c08cc8c33d00bda49e7e2cc90baff01835518dde43e2e8d5ebf7b76545fc2687ab10bc2b0911a141f3cf7f04f3cac438a135f"
    }

    static async getFontFile(font) {
        let response = await axios.get(this.getFontURL(font), {responseType: 'arraybuffer'})
        if (response.status != 200) {
            throw new Error(response.statusText)
        }
        //return response.data
        // var x = opentype.parse(response.data)
        // console.log(x)


        return this.convertWoff2ToTTF(new Uint8Array(response.data));
        //return woff2otf(response.data)
    }
}


/*
Issues:  

Non-zero pad bytes were found after name table 
Issues with japanese fonts. (https://fonts.adobe.com/fonts/source-han-sans-japanese) - Possible workaround: Remove non-`en` values from the name table?
Ivy Presto Headline Thin Italic doesn't open in Windows, but no major issues reported?
Font Checksum incorrect. (BIG)
Palast Variable looks bad in the Windows Font Installer compared to the raw, unrenamed version, but I cant find any actual issues with it in Gimp. Also the name is weird in the installer?
Code needs to be cleaned up a lot.
Macstyle Bold Bit not necessarily getting set to bold when a font is bold. eg https://fonts.adobe.com/fonts/adso

`Henri` is reporting that name and post tables are overlapping eachother. Investigate.

Commenting out the lines that actually rename the properties in the Name table actually causes IvoPresto to work. However, this does not fix Adso Bold.
I wish the windows font installer would tell you ~why~ it thinks a font is invalid, because these 'broken' fonts seem to work literally everywhere else.

Errors across different 'broken' fonts are inconsistant according to MS's Font Validator.

Font Collections dont show font previews in the UI :(

*/