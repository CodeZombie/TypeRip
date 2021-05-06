Vue.component('font-panel', {
    props: ['fontname', 'fontstyle', 'fonturl', 'sampletext', 'familyurl'],
    template: ' <div class="column four">\
                    <div class="item">\
                        <div class="upper"><p :style="{fontFamily : fontname}">{{sampletext}}</p></div>\
                        <div class="lower">\
                            <div class="info_container">\
                                <a :href="familyurl"><p>{{fontname}}</p></a>\
                                <p class="small">{{fontstyle}}</p>\
                            </div>\
                            <div class="button_container">\
                                <a class="button" v-on:click="$emit(\'clickdownload\')"><i class="icon ion-md-arrow-down"></i></a>\
                            </div>\
                        </div>\
                    </div>\
                </div>'
  })

var typeRipVue = new Vue({
    el: '#typeripvue',
    data: {
        urlInput: "",
        fontIsActive: false,
        fontFamily: {},
        rawDownload: false,
        message: {visible: true, title: "Typerip", text: "<p>The Adobe Font ripper.</p><br><p>Enter a font family URL from <a href='https://fonts.adobe.com/'>Adobe Fonts</a> to begin.</p><p>By using this tool, you agree to not violate copyright law or licenses established by the font owners, font foundries and/or Adobe. All fonts belong to their respective owners.</p><br><p>Fork this project on <a href='https://github.com/CodeZombie/TypeRip'>github</a></p><p>Big thanks to <a href='https://opentype.js.org/'>OpenType.js</a> for their javascript font library."}
    },
    methods: {
        showMessage: function(title_, text_) {
            this.fontIsActive = false
            this.message = {
                visible: true, 
                title: title_, 
                text: text_
            };
        },
        urlSubmitButtonPress: function() {
            this.showMessage("Loading...", "")
            TypeRip.handleRequest(this.urlInput, (responseType_, response_) => {
                if(responseType_ == "error"){
                    this.showMessage("Error", response_)
                }else{
                    this.fontFamily.name = response_.name
                    this.fontFamily.designers = response_.designers
                    this.fontFamily.fonts = response_.fonts
                    this.fontFamily.sampleText = response_.sampleText
                    this.fontIsActive = true

                    this.fontFamily.fonts.forEach(font => {
                        var font_css = document.createElement('style');
                        font_css.appendChild(document.createTextNode("@font-face { font-family: '" + font.name + "'; \src: url(" + font.url + ");}"));
                        document.head.appendChild(font_css);
                    });
                }
            })
        },
        downloadFonts: function(font_, zipFileName_) {
            TypeRip.downloadFonts(font_, zipFileName_, this.rawDownload);
        },
        getFontsInChunks: function(chunkSize_) {
            output = []
            if(this.fontFamily.fonts != null) {
                for(var i = 0; i < this.fontFamily.fonts.length; i++) {
                    if(i % chunkSize_ == 0 ){
                        output.push([]);
                    }
                    output[Math.floor(i / chunkSize_)].push(this.fontFamily.fonts[i])
                }
                return output
            }else{
                return []
            }
        }
    }
});