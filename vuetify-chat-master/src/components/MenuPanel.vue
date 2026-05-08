<template>
  <div>
    <v-card :class="compactView ? 'rounded-t-0' : 'rounded-ts-lg'" color="panel" class="rounded-0 elevation-1" style="height: 60px;">
      <div class="mt-2 mb-2 px-3 d-flex align-center justify-space-between" style="height: 100%;">
        
        <!-- Left side: Avatar (Click to open Profile) -->
        <div style="cursor: pointer;" @click="showProfile = true" class="d-flex align-center">
          <v-avatar size="40">
            <v-img v-if="currentUser.userImage && !imageError" :src="currentUser.userImage" @error="handleImageError" cover></v-img>
            <v-img v-else :src="defaultPhotoURL" cover></v-img>
          </v-avatar>
        </div>

        <!-- Right side: Actions -->
        <div class="d-flex align-center" style="gap: 15px;">
          
          <!-- Groups Icon -->
          <v-icon 
            size="large" 
            id="icon-groups" 
            :class="{ 'text-primary': isGroup }" 
            @click="toggleGroup" 
            color="icons">
            mdi-account-group
          </v-icon>
          
          <!-- Chats Icon -->
          <div class="d-flex" style="position: relative; cursor: pointer;">
            <v-icon 
              id="icon-chats" 
              :class="{ 'text-primary': isChat }" 
              size="large" 
              color="icons" 
              @click="toggleChat">
              mdi-chat
            </v-icon>
            <p v-if="totalUnreadMessagesCount" class="px-1 bg-pink-lighten-3 rounded-lg text-white"
              style="font-size: 10px; z-index: 1; user-select: none; position: absolute; right: -8px; top: -5px;">
              <span>{{ totalUnreadMessagesCount }}</span>
            </p>
          </div>

          <!-- Contacts/Search Icon -->
          <v-icon 
            size="large" 
            id="icon-search" 
            color="icons" 
            :class="{ 'text-primary': isSearch }" 
            @click="toggleSearch">
            mdi-message-text
          </v-icon>

          <!-- Settings Dropdown -->
          <v-menu :close-on-content-click="true">
            <template v-slot:activator="{ props }">
              <v-icon 
                v-bind="props" 
                size="large" 
                id="icon-settings" 
                class="ml-1"
                color="icons">
                mdi-dots-vertical
              </v-icon>
            </template>
            <v-list bg-color="submenu" width="180px" class="ml-2 elevation-3 rounded-lg">
              <v-list-item class="settings-items" title="Profile" @click="showProfile = true"></v-list-item>
              <v-list-item class="settings-items" title="Logout" @click="logout"></v-list-item>
            </v-list>
          </v-menu>

        </div>
      </div>
    </v-card>

    <!-- User Profile Dialog -->
    <UserProfileDialog v-model="showProfile" />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref } from "vue";
import { storeToRefs } from "pinia";

import { useMainStore } from "@/store/mainStore";
import { useChatStore } from "@/store/chatStore";
import { useMessageStore } from "@/store/messageStore";
import { useUserStore } from "@/store/userStore";
import { useTheme } from 'vuetify';
import { event } from "vue-gtag";

import UserProfileDialog from "@/components/UserProfileDialog.vue";

const theme = useTheme();
const router = useRouter();

const chatStore = useChatStore();
const mainStore = useMainStore();
const messageStore = useMessageStore();
const userStore = useUserStore();

const { isSearch, isChat, isGroup, compactView } = storeToRefs(mainStore);
const { isBottom, totalUnreadMessagesCount } = storeToRefs(chatStore);
const { currentUser, currentTheme } = storeToRefs(userStore);

const defaultPhotoURL = new URL("@/assets/photo-default.png", import.meta.url).href;
const imageError = ref(false);
const showProfile = ref(false);

const handleImageError = () => {
  imageError.value = true;
};

const toggleSearch = () => {
  isSearch.value = true;
  isChat.value = false;
  isGroup.value = false;
  chatStore.removeUnassignedChat();
  messageStore.clearMoreMessagesToLoad();
  isBottom.value = true;
};

const toggleChat = () => {
  isChat.value = true;
  isSearch.value = false;
  isGroup.value = false;
};

const toggleGroup = () => {
  isGroup.value = true;
  isChat.value = false;
  isSearch.value = false;
};

const logout = async () => {
  router.push("/");
  await userStore.logout();
  theme.global.name.value = 'teal'; // default theme
};
</script>

<style scoped>
#icon-search:hover,
#icon-chats:hover,
#icon-groups:hover,
#icon-settings:hover {
  color: rgb(var(--v-theme-primary)) !important;
  cursor: pointer;
}

.settings-items:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
</style>
