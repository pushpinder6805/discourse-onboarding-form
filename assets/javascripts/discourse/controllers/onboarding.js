import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class OnboardingController extends Controller {
  @tracked isSubmitting = false;
  @tracked fieldValues = {};
  @tracked errors = [];
  @tracked scrolledFields = {};

  get questionnaire() {
    return this.model?.questionnaire;
  }

  get fields() {
    return this.questionnaire?.fields || [];
  }

  get hasQuestionnaire() {
    return !!this.questionnaire;
  }

  get canSubmit() {
    if (!this.questionnaire) {
      return false;
    }
    for (const field of this.fields) {
      if (!field.required) {
        continue;
      }
      const val = this.fieldValues[field.id];
      if (
        field.type === "checkbox" ||
        field.type === "acceptance" ||
        field.type === "terms_and_conditions"
      ) {
        if (!val) {
          return false;
        }
      } else {
        if (!val || String(val).trim() === "") {
          return false;
        }
      }
    }
    return true;
  }

  isScrolled(fieldId) {
    return !!this.scrolledFields[fieldId];
  }

  @action
  updateField(fieldId, event) {
    const target = event.target;
    const value =
      target.type === "checkbox" ? target.checked : target.value;
    this.fieldValues = { ...this.fieldValues, [fieldId]: value };
  }

  @action
  markScrolled(fieldId, event) {
    const el = event.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      this.scrolledFields = { ...this.scrolledFields, [fieldId]: true };
    }
  }

  @action
  async submitForm() {
    if (!this.canSubmit || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.errors = [];

    try {
      const data = { final_submit: true };
      for (const field of this.fields) {
        data[field.id] = this.fieldValues[field.id] ?? "";
      }

      const result = await ajax("/questionnaire/submit", {
        type: "POST",
        data,
      });

      if (result.completed) {
        window.location.href = "/";
      }
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
