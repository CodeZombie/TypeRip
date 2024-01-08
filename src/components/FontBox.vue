<template>
<div class="column four">
    <div class="item">
        <div class="upper" >
            <p>{{sampletext}}</p>
        </div>
        <div class="lower">
            <div class="info_container">
                <a :href="familyurl"><p>{{fontname}}</p></a>
                <p class="small">{{fontstyle}}</p>
            </div>
            <div class="button_container">
                <a class="button" v-on:click="download()"><i class="icon ion-md-arrow-down"></i></a>
            </div>
        </div>
    </div>
</div>

</template>

<style scoped>

    .upper p {
        font-family: v-bind('fontname');
    }
</style>

<script>
export default {
    name: "FontBox",
    props: ['fontname', 'fontstyle', 'fonturl', 'sampletext', 'familyurl'],
    emits: ['download'],
    methods: {
        download() {
            this.$emit('download', this.fonturl, this.fontname)
        }
    },
    created() {
        var newStyle = document.createElement('style');
        newStyle.appendChild(document.createTextNode("\
        @font-face {\
            font-family: '" + this.fontname + "';\
            src: url('" + this.fonturl + "');\
        }\
        "));

        document.head.appendChild(newStyle)
    }
}
</script>
