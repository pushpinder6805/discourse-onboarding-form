export default {
  resource: "admin",
  map() {
    this.route("adminPluginsOnboarding", {
      path: "/plugins/onboarding",
      resetNamespace: true,
    });
  },
};
