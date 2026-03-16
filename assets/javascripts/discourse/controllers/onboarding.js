import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "France", "India", "Mexico", "Brazil", "Other"
];

export default class OnboardingController extends Controller {
  @tracked currentStep = 1;
  @tracked isSubmitting = false;
  @tracked errors = [];

  @tracked agreedToTerms = false;

  @tracked role = "";
  @tracked groupsServed = [];
  @tracked statesWorked = [];

  @tracked firstName = "";
  @tracked lastName = "";
  @tracked pronouns = "";
  @tracked phone = "";
  @tracked altPhone = "";
  @tracked organization = "";
  @tracked organizationType = "";
  @tracked country = "";
  @tracked state = "";
  @tracked city = "";
  @tracked zip = "";

  totalSteps = 3;

  roleOptions = [
    "Mediator", "Attorney", "Judge", "Court Staff", "Program Administrator",
    "Researcher", "Student", "Policy Professional", "Other"
  ];

  groupOptions = [
    "Families", "Children", "Victims", "Low-income individuals", "Veterans",
    "Immigrants", "Small businesses", "People with disabilities", "Other"
  ];

  usStates = US_STATES;
  countryOptions = COUNTRIES;

  pronounOptions = [
    "He / Him", "She / Her", "They / Them", "He / They", "She / They",
    "Prefer not to say", "Other"
  ];

  organizationTypes = [
    "Nonprofit", "Government", "Court", "Private Firm",
    "Academic Institution", "NGO", "Other"
  ];

  get stepDots() {
    return Array.from({ length: this.totalSteps }, (_, i) => ({
      index: i + 1,
      active: i + 1 === this.currentStep,
      completed: i + 1 < this.currentStep,
    }));
  }

  get isStep1Valid() {
    return this.agreedToTerms;
  }

  get isStep2Valid() {
    return this.role.length > 0 && this.groupsServed.length > 0;
  }

  get isStep3Valid() {
    return (
      this.firstName.length > 0 &&
      this.pronouns.length > 0 &&
      this.phone.length > 0 &&
      this.organization.length > 0 &&
      this.organizationType.length > 0 &&
      this.country.length > 0 &&
      this.state.length > 0
    );
  }

  get canProceed() {
    if (this.currentStep === 1) return this.isStep1Valid;
    if (this.currentStep === 2) return this.isStep2Valid;
    if (this.currentStep === 3) return this.isStep3Valid;
    return false;
  }

  get isLastStep() {
    return this.currentStep === this.totalSteps;
  }

  @action
  toggleGroup(group) {
    if (this.groupsServed.includes(group)) {
      this.groupsServed = this.groupsServed.filter((g) => g !== group);
    } else {
      this.groupsServed = [...this.groupsServed, group];
    }
  }

  @action
  toggleStateWorked(st) {
    if (this.statesWorked.includes(st)) {
      this.statesWorked = this.statesWorked.filter((s) => s !== st);
    } else {
      this.statesWorked = [...this.statesWorked, st];
    }
  }

  @action
  formatPhoneInput(event) {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length >= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    this.phone = value;
  }

  @action
  formatAltPhoneInput(event) {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length >= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    this.altPhone = value;
  }

  async saveStep(isFinal = false) {
    this.isSubmitting = true;
    this.errors = [];

    try {
      const result = await ajax("/onboarding/submit", {
        type: "POST",
        data: {
          role: this.role,
          groups_served: this.groupsServed,
          states_worked: this.statesWorked,
          first_name: this.firstName,
          last_name: this.lastName,
          pronouns: this.pronouns,
          phone: this.phone,
          alt_phone: this.altPhone,
          organization: this.organization,
          organization_type: this.organizationType,
          country: this.country,
          state: this.state,
          city: this.city,
          zip: this.zip,
          agreed_to_terms: this.agreedToTerms,
          current_step: this.currentStep,
          final_submit: isFinal,
        },
      });

      if (result.completed) {
        window.location.href = "/";
      }

      return result;
    } catch (error) {
      popupAjaxError(error);
      return null;
    } finally {
      this.isSubmitting = false;
    }
  }

  @action
  async nextStep() {
    if (!this.canProceed) return;
    const result = await this.saveStep(false);
    if (result) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    }
  }

  @action
  prevStep() {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  @action
  async submitForm() {
    if (!this.isStep3Valid) return;
    await this.saveStep(true);
  }
}
