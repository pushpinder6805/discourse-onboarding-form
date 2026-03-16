export default {
  resource: "admin",
  map() {
    this.route(
      "adminPluginsOnboarding",
      { path: "/plugins/onboarding", resetNamespace: true },
      function () {
        this.route("adminPluginsOnboardingBuilder", {
          path: "/builder",
          resetNamespace: true,
        });
        this.route("adminPluginsOnboardingSubmissions", {
          path: "/submissions",
          resetNamespace: true,
        });
      }
    );
  },
};
