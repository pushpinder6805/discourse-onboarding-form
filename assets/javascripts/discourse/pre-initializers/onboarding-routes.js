export default {
  name: "onboarding-routes",
  before: "inject-discourse-objects",
  initialize() {
    const Router = require("discourse/routes/discourse").default;
    Router.map(function () {
      this.route("onboarding", { path: "/questionnaire" });
    });
  },
};
