<template>
    <div class="row">
        <div class="column">
            <div class="alertBox">
                <div class="info_container">
                    <h3>{{fontset.name}}</h3>
                    <p class="subtext" v-if="fontset.designers.length > 0">
                        by 
                        <span v-for="(designer, key) in fontset.designers"><a v-bind:href="designer.url">{{designer.name}}</a><span v-if="key < fontset.designers.length -1">, </span></span>
                    </p>
                </div>
                <div class="button_container">
                    <a class="button" v-on:click="download(fontset.fonts, fontset.name)">Download All</a>
                </div>
            </div>
        </div>   
    </div>
    <div class="row" v-for="(chunk, c_key) in getFontsInChunks(3)">
        <FontBox v-for="(font, f_key) in chunk" v-bind:key="(c_key * 3) + f_key" v-on:download="download([font], font.name)" v-bind:fontfamily="font.familyName" v-bind:fontname="font.name" v-bind:fontstyle="font.style" v-bind:fonturl="TypeRip.getFontURL(font)" v-bind:fontdefaultlanguage="font.defaultLanguage" v-bind:sampletext="font.sampleText" v-bind:familyurl="font.familyUrl"></FontBox>
    </div>
</template>

<script>
export default {
    name: "FontSetContainer",
    props: ['fontset'],
    emits: ['download'],
    methods: {
        download(fonts, family_name) {
            this.$emit('download', fonts, family_name)
        },
        getFontsInChunks: function(chunkSize_) {
            let output = []
            if(this.fontset.fonts != null) {
                for(var i = 0; i < this.fontset.fonts.length; i++) {
                    if(i % chunkSize_ == 0 ){
                        output.push([]);
                    }
                    output[Math.floor(i / chunkSize_)].push(this.fontset.fonts[i])
                }
                return output
            }
            return []
        }
    }
}
</script>

<script setup>
import FontBox from './FontBox.vue';
import TypeRip from '../scripts/typerip.js'
</script>
