<template>
    <div class="column">
        <div class="alertBox">
            <div class="info_container">
                <h3>{{ title }}</h3>
                <p class="subtext" v-html="htmlContent"></p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "MessageBox",
    props: ['title', 'htmlContent']
}
</script>
