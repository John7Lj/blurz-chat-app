/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'teal',
    themes: {
      midnight: {
        colors: {
          icons: "#78909C", // Dark gray or black
          secondary: "#FFA000", // Dark yellow or gold
          background: "#ECEFF1",
          primary: "#ffffff", // White icons for contrast
          panel: "#263238", // Dark panel color
          items: "#37474f", // Dark items color
          select: "#FFA000", // Dark yellow or gold for select elements
          scroll: "#BDBDBD", //grey-lighten-1
          track: "#1a1a1a", // Dark scrollbar track color
          submenu: "#E0E0E0", //grey-lighten-2
          appbar: '#546E7A', //cyan-lighten-4
          logoleft: "#263238", //teal-lighten-3
          logoright: "#ffffff", //teal-darken-2
          send: '#263238', //blue-grey-darken-4
        },
      },
      teal: {
        colors: {
          background: "#F5F5F5", 
          primary: "#1A237E", // navy (indigo-darken-4)
          secondary: "#7986CB",
          icons: "#1E88E5", // blue (blue-darken-1)
          panel: "#BBDEFB", // blue-lighten-4
          items: "#E3F2FD", // blue-lighten-5
          select: "#1565C0", // blue-darken-3
          scroll: "#1A237E", // navy
          track: "#90CAF9", // blue-lighten-3
          submenu:  "#E3F2FD", // blue-lighten-5
          appbar: '#BBDEFB', // blue-lighten-4
          logoleft: "#64B5F6", // blue-lighten-2
          logoright: "#0D47A1", // blue-darken-4
          send: "#1A237E", // navy
        },
      },
    },

  },
});
