import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "onboarding-redirect",
  initialize(container) {
    withPluginApi((api) => {
      const siteSettings = container.lookup("service:site-settings");
      if (!siteSettings.onboarding_enabled) {
        return;
      }

      api.onAppEvent("page:changed", async (data) => {
        const currentUser = api.getCurrentUser();
        if (!currentUser) {
          return;
        }
        if (data.url === "/onboarding") {
          return;
        }

        if (currentUser.onboarding_completed === false) {
          try {
            const result = await ajax("/onboarding/status");
            if (result.required && !result.completed) {
              window.location.href = "/onboarding";
            }
          } catch {
          }
        }
      });

      const messageBus = container.lookup("service:message-bus");
      const currentUser = api.getCurrentUser();
      if (currentUser) {
        messageBus.subscribe(
          `/onboarding/redirect/${currentUser.id}`,
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
