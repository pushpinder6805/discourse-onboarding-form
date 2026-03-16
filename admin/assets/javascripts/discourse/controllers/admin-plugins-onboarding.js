import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class AdminPluginsOnboardingController extends Controller {
  @tracked submissions = [];
  @tracked total = 0;
  @tracked page = 0;
  @tracked search = "";
  @tracked selectedSubmission = null;
  @tracked isLoading = false;

  perPage = 50;

  get hasMore() {
    return this.submissions.length < this.total;
  }

  get totalPages() {
    return Math.ceil(this.total / this.perPage);
  }

  @action
  async loadSubmissions(resetPage = true) {
    if (resetPage) {
      this.page = 0;
    }
    this.isLoading = true;

    try {
      const result = await ajax("/admin/plugins/onboarding/submissions", {
        data: { page: this.page, search: this.search },
      });
      this.submissions = resetPage
        ? result.submissions
        : [...this.submissions, ...result.submissions];
      this.total = result.total;
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async loadMore() {
    if (!this.hasMore) {
      return;
    }
    this.page++;
    await this.loadSubmissions(false);
  }

  @action
  updateSearch(event) {
    this.search = event.target.value;
  }

  @action
  async performSearch() {
    await this.loadSubmissions(true);
  }

  @action
  async viewSubmission(id) {
    try {
      const result = await ajax(`/admin/plugins/onboarding/submissions/${id}`);
      this.selectedSubmission = result.submission;
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  closeDetail() {
    this.selectedSubmission = null;
  }

  @action
  async deleteSubmission(id) {
    try {
      await ajax(`/admin/plugins/onboarding/submissions/${id}`, {
        type: "DELETE",
      });
      this.submissions = this.submissions.filter((s) => s.id !== id);
      this.total--;
      if (this.selectedSubmission?.id === id) {
        this.selectedSubmission = null;
      }
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  exportCSV() {
    window.location.href = "/admin/plugins/onboarding/export";
  }
}
