import Route from "@ember/routing/route";
import { ajax } from "discourse/lib/ajax";

export default class OnboardingRoute extends Route {
  async model() {
    try {
      const result = await ajax("/questionnaire");
      return result;
    } catch {
      return { completed: false, questionnaire: null };
    }
  }

  afterModel(model) {
    if (model.completed) {
      window.location.href = "/";
    }
  }
}
