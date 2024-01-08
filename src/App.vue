<script setup>
import SearchBar from './components/SearchBar.vue'
import TypeRip  from './scripts/typerip.js'
import MessageBox from './components/MessageBox.vue'
import FontsetContainer from './components/FontSetContainer.vue'
import { FontSet } from './models/fontset.js'
</script>

<style>
@import 'https://unpkg.com/ionicons@4.5.10-0/dist/css/ionicons.min.css';
@import 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600&display=swap';
@import 'https://fonts.googleapis.com/css?family=Source+Code+Pro&display=swap';
</style>

<template>
  <header>
    <SearchBar v-on:url-submit="submit_url" />
  </header>
  <article>
    <div class="grid">
      <MessageBox v-if="message_is_visible" :title="message_title" :htmlContent="message_text" />
      <FontsetContainer v-if="active_font_group" :fontset="active_font_group" v-on:download="download" />
    </div>
  </article>
</template>

<script>
export default {
  data: () => ({
    message_is_visible: true,
    message_title: "TypeRip",
    message_text: "<p><strong>The <a href='https://fonts.adobe.com/'>Adobe Fonts</a> ripper</strong></p><p>Updated January 2024</p><br/><p>Enter a Font Family or Font Pack URL from <a href='https://fonts.adobe.com/'>Adobe Fonts</a> to begin.</p><p>By using this tool, you agree to not violate copyright law or licenses established by the font owners, font foundries and/or Adobe. All fonts belong to their respective owners.</p><br><p>Having an issue? Report it on <a href='https://github.com/CodeZombie/TypeRip'>GitHub</a></p>",
    active_font_group: null,
  }),

  methods: {
    display_message(message_title, message_text) {
      this.message_is_visible = true;
      this.message_title = message_title;
      this.message_text = message_text;
    },

    submit_url(url) {
      this.display_message("Fetching font data...", "Please wait...")
      this.active_font_group = null
      url = TypeRip.prependHttpsToURL(url)

      let url_type = TypeRip.getURLType(url)

      if (url_type == TypeRip.URLTypes.Invalid) {
        this.display_message("Invalid URL")
        return
      }


      if (url_type == TypeRip.URLTypes.FontFamily) {
        TypeRip.getFontFamily(url, this.on_font_group_data_ready)
      } else if (url_type == TypeRip.URLTypes.FontCollection) {
        TypeRip.getFontCollection(url, this.on_font_group_data_ready)
      }
    },

    on_font_group_data_ready(response_status, response) {
        if (response_status == TypeRip.ResponseTypes.Error) {
          return this.display_message("Request Failed", response)
        }
        this.set_font_group(new FontSet(response.name, response.designers, response.fonts, response.sampleText))
      },

    set_font_group(font_group) {
      this.message_is_visible = false
      this.active_font_group = font_group
    },

    download(fonts, family_name) {
      TypeRip.downloadFontsAsZip(fonts, family_name)
    }
  }
}
</script>