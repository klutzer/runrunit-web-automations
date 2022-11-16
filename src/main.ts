import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";

import App from "@/App.vue";
import { createApp } from "vue";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt, faKey, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faRobot, faKey, faExternalLinkAlt);

createApp(App)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");
