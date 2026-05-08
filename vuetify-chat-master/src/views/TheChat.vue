<template>
  <v-container fluid class="pa-0 ma-0" style="height: 100vh; overflow: hidden; background-color: rgb(var(--v-theme-background));">
    <v-row no-gutters class="fill-height">
      <!-- LEFT PANEL START -->
      <v-col 
        class="bg-items fill-height d-flex flex-column border-e" 
        :cols="compactView ? 12 : 3" 
        style="min-width: 350px; border-right: 1px solid rgba(128,128,128,0.2) !important;">
        
        <!-- Sidebar Header (WhatsApp style) -->
        <MenuPanel v-show="!compactView || (compactView && (!isChat || !chatSelected))" />

        <!-- Scrollable Lists Area -->
        <div class="flex-grow-1" style="overflow-y: auto;">
          <suspense v-if="isSearch">
            <template #default>
              <ContactsList class="fill-height" />
            </template>
            <template #fallback>
              <ContactsLoading v-once class="fill-height" />
            </template>
          </suspense>

          <ChatsList v-if="(isChat && !chatSelected) || (isChat && !compactView)"
            class="fill-height" />

          <GroupsList v-if="!compactView && isGroup" class="fill-height" />
        </div>
      </v-col>
      <!-- LEFT PANEL END -->

      <!-- RIGHT PANEL START -->
      <v-col v-if="!compactView || (compactView && isChat && chatSelected)" class="fill-height bg-panel d-flex flex-column">

        <!-- Mobile Back Button in header when viewing chat -->
        <v-card v-if="compactView && chatSelected" color="panel" class="rounded-0 elevation-1 d-flex align-center px-4" style="height: 60px;">
           <v-icon @click="chatStore.clearSelectedChat()">mdi-arrow-left</v-icon>
           <span class="ml-4 font-weight-bold">Back to chats</span>
        </v-card>

        <!-- Main Chat content -->
        <SelectedChatWindow v-if="isChat && chatSelected" class="flex-grow-1" />
        <EmptyChatWindow v-else-if="isChat && !chatSelected" class="flex-grow-1 d-flex align-center justify-center" />
        <EmptySearchWindow v-else-if="isSearch" class="flex-grow-1 d-flex align-center justify-center" />
        <EmptyGroupWindow v-else-if="isGroup" class="flex-grow-1 d-flex align-center justify-center" />
      </v-col>
      <!-- RIGHT PANEL END -->
    </v-row>

    <!-- Global Alerts -->
    <v-alert v-if="Object.keys(systemMessage).length > 0"
           height="70px"
           :color="alertColor"
           style="position: absolute; bottom: 30px; z-index: 1000;"
           :style="compactView ? 'right: 10%; left: 10%;' : 'right: 30%; left: 30%;'"
           closable
           theme="dark"
           :icon="alertIcon"
           class="mt-3 text-center text-subtitle-1 font-weight-bold mx-auto rounded-xl elevation-5">
    {{ systemMessage.content }}
  </v-alert>
  </v-container>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  onUpdated,
  defineAsyncComponent,
  computed,
} from "vue";
import { storeToRefs } from "pinia";
import { useTheme } from 'vuetify'

const theme = useTheme();

const ContactsList = defineAsyncComponent(() => import("@/components/ContactsList.vue"));
const GroupsList = defineAsyncComponent(() => import("@/components/GroupsList.vue"));

import EmptyChatWindow from "@/components/EmptyChatWindow.vue";
import ChatsList from "@/components/ChatsList.vue";
import MenuPanel from "@/components/MenuPanel.vue";
import ContactsLoading from "@/components/ContactsLoading.vue";
import SelectedChatWindow from "@/components/chat/SelectedChatWindow.vue"
import EmptyGroupWindow from "@/components/EmptyGroupWindow.vue"
import EmptySearchWindow from "@/components/EmptySearchWindow.vue"

import { useChatStore } from "@/store/chatStore";
import { useMessageStore } from "@/store/messageStore";
import { useMainStore } from "@/store/mainStore";
import { useWebsocketStore } from "@/store/websocketStore";
import { useUserStore } from "@/store/userStore";

const chatStore = useChatStore();
const messageStore = useMessageStore();
const mainStore = useMainStore();
const websocketStore = useWebsocketStore();
const userStore = useUserStore();

const { chatSelected } = storeToRefs(chatStore);
const { systemMessage } = storeToRefs(messageStore);
const { isSearch, isChat, isGroup, compactView } = storeToRefs(mainStore);
const { currentUser, currentTheme } = storeToRefs(userStore);

const alertColor = computed(() => {
  switch (systemMessage.value.type) {
    case 'error': return 'pink-accent-2';
    case 'success': return 'green-accent-1';
    case 'info': return 'orange-lighten-4';
    default: return 'indigo-lighten-2';
  }
});
const alertIcon = computed(() => {
  switch (systemMessage.value.type) {
    case 'success': return 'mdi-power-plug';
    case 'error': return 'mdi-power-plug-off';
    case 'info': return 'mdi-information-variant';
    default: return '';
  }
});

const activeTab = ref(true);

document.addEventListener("visibilitychange", () => {
  activeTab.value = !document.hidden;
});

const handleWindowChange = () => {
  compactView.value = window.innerWidth < 700;
};

onMounted(async () => {
  theme.global.name.value = currentTheme.value;

  await chatStore.getDirectChats(currentUser.value.userGUID);
  if (!websocketStore.socketExists) {
    await websocketStore.connectWebsocket();
    messageStore.displaySystemMessage("success", "Websocket connected", 1000)
  }

  userStore.setEmptyFriendStatuses();

  window.addEventListener("resize", handleWindowChange);
  handleWindowChange();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleWindowChange);
});
</script>

<style scoped>
/* You can add custom WhatsApp background pattern here for the right panel */
.bg-panel {
  background-color: rgb(var(--v-theme-background));
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(128,128,128,0.3);
  border-radius: 10px;
}
</style>
