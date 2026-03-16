import Route from "@ember/routing/route";
import { ajax } from "discourse/lib/ajax";

export default class OnboardingRoute extends Route {
  async model() {
    try {
      const result = await ajax("/onboarding/status");
      return result;
    } catch {
      return { completed: false, required: true };
    }
  }

  afterModel(model) {
    if (model.completed) {
      this.router.transitionTo("/");
    }
  }
}
