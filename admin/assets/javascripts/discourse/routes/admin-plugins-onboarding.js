import Route from "@ember/routing/route";
import { ajax } from "discourse/lib/ajax";

export default class AdminPluginsOnboardingRoute extends Route {
  async model() {
    try {
      const result = await ajax("/admin/plugins/onboarding/questionnaires");
      return result;
    } catch {
      return { questionnaires: [] };
    }
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set("questionnaires", model.questionnaires || []);
  }
}
