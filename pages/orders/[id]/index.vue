<template>
  <div>
    <button v-if="isInProgressStatus.value">Refuse</button>
  </div>
</template>
<script>
export default {
  data() {
    return {
      // other data properties
      menuItems: [
        // other menu items
        { title: 'Refuse', condition: isInProgressStatus.value },
      ],
    };
  },
};
</script>