export default {
  name: "onboarding-routes",
  before: "inject-discourse-objects",
  initialize() {
    if (typeof requirejs !== "undefined") {
      requirejs.define(
        "discourse/routes/onboarding",
        ["exports", "@ember/routing/route", "discourse/lib/ajax"],
        function (exports, _route, _ajax) {
          "use strict";
        }
      );
    }
  },
};
