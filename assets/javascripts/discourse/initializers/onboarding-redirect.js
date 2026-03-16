import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "onboarding-redirect",
  initialize(container) {
    withPluginApi((api) => {
      const siteSettings = container.lookup("service:site-settings");
      if (!siteSettings.onboarding_enabled) {
        return;
      }

      api.onAppEvent("page:changed", (data) => {
        const currentUser = api.getCurrentUser();
        if (!currentUser) {
          return;
        }
        if (data.url === "/questionnaire") {
          return;
        }
        if (currentUser.questionnaire_required) {
          window.location.href = "/questionnaire";
        }
      });

      const messageBus = container.lookup("service:message-bus");
      const currentUser = api.getCurrentUser();
      if (currentUser) {
        messageBus.subscribe(
          `/questionnaire/redirect/${currentUser.id}`,
          (data) => {
            if (data.redirect) {
              window.location.href = data.redirect;
            }
          }
        );
      }
    });
  },
};
