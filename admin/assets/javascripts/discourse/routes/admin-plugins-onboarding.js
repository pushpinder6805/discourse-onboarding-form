import Route from "@ember/routing/route";
import { ajax } from "discourse/lib/ajax";

export default class AdminPluginsOnboardingRoute extends Route {
  async model() {
    try {
      const result = await ajax("/admin/plugins/onboarding/submissions", {
        data: { page: 0 },
      });
      return result;
    } catch {
      return { submissions: [], total: 0, page: 0 };
    }
  }
}
