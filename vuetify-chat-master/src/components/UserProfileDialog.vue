<template>
  <v-dialog v-model="isOpen" max-width="400px">
    <v-card class="rounded-lg">
      <v-card-title class="bg-teal text-white d-flex align-center">
        Profile
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" color="white"></v-btn>
      </v-card-title>
      
      <v-card-text class="text-center pt-6 pb-6 bg-items">
        <v-avatar size="150" class="mb-4 elevation-2">
          <v-img 
            v-if="currentUser.userImage && !imageError" 
            :src="currentUser.userImage" 
            @error="imageError = true"
            cover
          ></v-img>
          <v-img v-else :src="defaultPhotoURL" cover></v-img>
        </v-avatar>
        
        <h2 class="text-h5 font-weight-bold mb-1">{{ currentUser.firstName }} {{ currentUser.lastName }}</h2>
        <p class="text-subtitle-1 text-grey-darken-1 mb-4">@{{ currentUser.username }}</p>
        
        <v-divider class="mb-4"></v-divider>
        
        <div class="text-left px-4">
          <div class="mb-3">
            <div class="text-caption text-grey">Email</div>
            <div class="text-body-1">{{ currentUser.email }}</div>
          </div>
          <div class="mb-3">
            <div class="text-caption text-grey">Theme</div>
            <div class="d-flex align-center mt-1">
              <v-switch 
                v-model="currentTheme" 
                true-value="teal" 
                false-value="midnight" 
                :label="currentTheme === 'teal' ? 'Light (Teal)' : 'Dark (Midnight)'" 
                color="teal-lighten-2" 
                @change="switchTheme" 
                hide-details
                density="compact"
              ></v-switch>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from "@/store/userStore";
import { storeToRefs } from "pinia";
import { useTheme } from 'vuetify';

const defaultPhotoURL = new URL("@/assets/photo-default.png", import.meta.url).href;
const userStore = useUserStore();
const { currentUser, currentTheme } = storeToRefs(userStore);
const theme = useTheme();

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const imageError = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const closeDialog = () => {
  isOpen.value = false;
};

const switchTheme = async () => {
  theme.global.name.value = currentTheme.value;
  await userStore.setUserTheme(currentTheme.value);
};
</script>
