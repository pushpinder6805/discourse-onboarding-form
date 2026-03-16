import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

const FIELD_TYPES = [
  { value: "text", label: "Text (single line)" },
  { value: "textarea", label: "Text Area (multi-line)" },
  { value: "phone", label: "Phone Number" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "acceptance", label: "Acceptance (tick to agree)" },
  { value: "terms_and_conditions", label: "Terms & Conditions (scroll + accept)" },
];

function generateId(label) {
  return (label || "field")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field_" + Date.now();
}

export default class AdminPluginsOnboardingController extends Controller {
  @tracked questionnaires = [];
  @tracked activeTab = "builder";

  @tracked editingQuestionnaire = null;
  @tracked isSaving = false;

  @tracked submissions = [];
  @tracked submissionsTotal = 0;
  @tracked submissionsPage = 0;
  @tracked submissionsSearch = "";
  @tracked isLoadingSubmissions = false;
  @tracked selectedSubmission = null;

  fieldTypes = FIELD_TYPES;

  get hasQuestionnaires() {
    return this.questionnaires.length > 0;
  }

  get hasMoreSubmissions() {
    return this.submissions.length < this.submissionsTotal;
  }

  @action
  switchTab(tab) {
    this.activeTab = tab;
    if (tab === "submissions" && this.submissions.length === 0) {
      this.loadSubmissions();
    }
  }

  @action
  newQuestionnaire() {
    this.editingQuestionnaire = {
      id: null,
      name: "",
      description: "",
      enabled: true,
      require_after_signup: true,
      fields: [],
    };
  }

  @action
  editQuestionnaire(q) {
    this.editingQuestionnaire = {
      id: q.id,
      name: q.name,
      description: q.description || "",
      enabled: q.enabled,
      require_after_signup: q.require_after_signup,
      fields: (q.fields || []).map((f) => ({ ...f })),
    };
  }

  @action
  cancelEdit() {
    this.editingQuestionnaire = null;
  }

  @action
  updateQuestionnaireName(event) {
    this.editingQuestionnaire = {
      ...this.editingQuestionnaire,
      name: event.target.value,
    };
  }

  @action
  updateQuestionnaireDescription(event) {
    this.editingQuestionnaire = {
      ...this.editingQuestionnaire,
      description: event.target.value,
    };
  }

  @action
  toggleRequireAfterSignup() {
    this.editingQuestionnaire = {
      ...this.editingQuestionnaire,
      require_after_signup: !this.editingQuestionnaire.require_after_signup,
    };
  }

  @action
  toggleEnabled() {
    this.editingQuestionnaire = {
      ...this.editingQuestionnaire,
      enabled: !this.editingQuestionnaire.enabled,
    };
  }

  @action
  addField() {
    const newField = {
      id: "field_" + Date.now(),
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      content: "",
    };
    this.editingQuestionnaire = {
      ...this.editingQuestionnaire,
      fields: [...this.editingQuestionnaire.fields, newField],
    };
  }

  @action
  removeField(index) {
    const fields = [...this.editingQuestionnaire.fields];
    fields.splice(index, 1);
    this.editingQuestionnaire = { ...this.editingQuestionnaire, fields };
  }

  @action
  moveFieldUp(index) {
    if (index === 0) {
      return;
    }
    const fields = [...this.editingQuestionnaire.fields];
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    this.editingQuestionnaire = { ...this.editingQuestionnaire, fields };
  }

  @action
  moveFieldDown(index) {
    const fields = [...this.editingQuestionnaire.fields];
    if (index === fields.length - 1) {
      return;
    }
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    this.editingQuestionnaire = { ...this.editingQuestionnaire, fields };
  }

  @action
  updateField(index, prop, event) {
    const fields = [...this.editingQuestionnaire.fields];
    const value =
      prop === "required"
        ? event.target.checked
        : event.target.value;

    fields[index] = { ...fields[index], [prop]: value };

    if (prop === "label" && fields[index].id.startsWith("field_")) {
      fields[index].id = generateId(value);
    }

    this.editingQuestionnaire = { ...this.editingQuestionnaire, fields };
  }

  @action
  async saveQuestionnaire() {
    if (!this.editingQuestionnaire.name.trim()) {
      return;
    }
    this.isSaving = true;
    try {
      const payload = {
        questionnaire: {
          name: this.editingQuestionnaire.name,
          description: this.editingQuestionnaire.description,
          enabled: this.editingQuestionnaire.enabled,
          require_after_signup: this.editingQuestionnaire.require_after_signup,
          fields: this.editingQuestionnaire.fields,
        },
      };

      let result;
      if (this.editingQuestionnaire.id) {
        result = await ajax(
          `/admin/plugins/onboarding/questionnaires/${this.editingQuestionnaire.id}`,
          {
            type: "PUT",
            data: JSON.stringify(payload),
            contentType: "application/json",
          }
        );
        this.questionnaires = this.questionnaires.map((q) =>
          q.id === result.questionnaire.id ? result.questionnaire : q
        );
      } else {
        result = await ajax("/admin/plugins/onboarding/questionnaires", {
          type: "POST",
          data: JSON.stringify(payload),
          contentType: "application/json",
        });
        this.questionnaires = [result.questionnaire, ...this.questionnaires];
      }
      this.editingQuestionnaire = null;
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isSaving = false;
    }
  }

  @action
  async deleteQuestionnaire(id) {
    try {
      await ajax(`/admin/plugins/onboarding/questionnaires/${id}`, {
        type: "DELETE",
      });
      this.questionnaires = this.questionnaires.filter((q) => q.id !== id);
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  async loadSubmissions(resetPage = true) {
    if (resetPage) {
      this.submissionsPage = 0;
    }
    this.isLoadingSubmissions = true;
    try {
      const result = await ajax("/admin/plugins/onboarding/submissions", {
        data: { page: this.submissionsPage, search: this.submissionsSearch },
      });
      this.submissions = resetPage
        ? result.submissions
        : [...this.submissions, ...result.submissions];
      this.submissionsTotal = result.total;
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isLoadingSubmissions = false;
    }
  }

  @action
  async loadMoreSubmissions() {
    if (!this.hasMoreSubmissions) {
      return;
    }
    this.submissionsPage++;
    await this.loadSubmissions(false);
  }

  @action
  updateSubmissionsSearch(event) {
    this.submissionsSearch = event.target.value;
  }

  @action
  async searchSubmissions() {
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
  closeSubmissionDetail() {
    this.selectedSubmission = null;
  }

  @action
  async deleteSubmission(id) {
    try {
      await ajax(`/admin/plugins/onboarding/submissions/${id}`, {
        type: "DELETE",
      });
      this.submissions = this.submissions.filter((s) => s.id !== id);
      this.submissionsTotal = Math.max(0, this.submissionsTotal - 1);
      if (this.selectedSubmission?.id === id) {
        this.selectedSubmission = null;
      }
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  exportCSV() {
    window.location.href = "/admin/plugins/onboarding/submissions/export";
  }
}
