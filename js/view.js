var x = new Vue({
    el: '#app',
    data: {
        url_input: "",
        fonts: [],
        message: {visible: true, text: "Welcome to Typerip: the Typekit font ripper. Enter a Typekit URL and click 'rip fonts'"}
    },
    methods: {
        showMessage: function(message_) {
            this.fonts = [];
            this.message = {visible: true, text: message_};
        },
        searchButtonOnClick: function() {
            this.showMessage("Loading...")
            ripFonts(this.$refs.url_input.value, this, function(ret_, v_) {
                v_.fonts = [];
                if (ret_.error == true) {
                    v_.showMessage(ret_.message);
                }else{
                    v_.message.visible = false;
                    ret_.data.fonts.forEach(font => {

                        var font_css = document.createElement('style');
                        font_css.appendChild(document.createTextNode("@font-face { font-family: '" + font.name + "';\src: url(" + font.url + ");}"));
                        document.head.appendChild(font_css);

                        v_.fonts.push({name: font.name, url: font.url, foundry_slug: font.foundry_slug, expanded: false});
                    });
                }
            });
        },
        fontDownloadButtonOnClick: function(url_, name_) {
            downloadFont(url_, name_);
        }
    }
});