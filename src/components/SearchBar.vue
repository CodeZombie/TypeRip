<template>
    <div id="icon">Tr</div>
    <input v-model="urlInput" v-on:keyup.enter="urlSubmitted" id="url_input" type="text" placeholder="Adobe Fonts font family URL" />
    <div id="url_submit_button" v-on:click="urlSubmitted">
        <i class="icon ion-md-search"></i>
    </div>
</template>

<style scoped>
</style>

<script>
export default {
    name: "SearchBar",
    emits: ['urlSubmit'],
    data: () => ({
        urlInput: ""
    }),
    methods: {
        urlSubmitted() {
            this.$emit('urlSubmit', this.urlInput);
        }
    }
}
</script>
