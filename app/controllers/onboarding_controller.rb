# frozen_string_literal: true

class OnboardingController < ApplicationController
  requires_plugin "discourse-onboarding-form"
  before_action :ensure_logged_in
  before_action :ensure_onboarding_enabled

  def show
    questionnaire = QuestionnaireDefinition.active
    submission = OnboardingSubmission.find_by(user_id: current_user.id)

    render json: {
      completed: submission&.completed || false,
      data: submission&.data || {},
      questionnaire: questionnaire ? serialize_questionnaire(questionnaire) : nil
    }
  end

  def status
    questionnaire = QuestionnaireDefinition.active
    submission = OnboardingSubmission.find_by(user_id: current_user.id)
    render json: {
      completed: submission&.completed || false,
      required: questionnaire.present? && !submission&.completed
    }
  end

  def submit
    questionnaire = QuestionnaireDefinition.active
    return render json: { errors: ["No active questionnaire found."] }, status: 422 unless questionnaire

    submission = OnboardingSubmission.for_user(current_user.id, questionnaire.id)
    merged_data = (submission.data || {}).merge(submission_params(questionnaire))
    submission.data = merged_data

    if params[:final_submit].to_s == "true"
      if valid_submission?(merged_data, questionnaire)
        submission.completed = true
      else
        return render json: { errors: ["Please complete all required fields."] }, status: 422
      end
    end

    if submission.save
      render json: { success: true, completed: submission.completed }
    else
      render json: { errors: submission.errors.full_messages }, status: 422
    end
  end

  private

  def ensure_onboarding_enabled
    raise Discourse::NotFound unless SiteSetting.onboarding_enabled
  end

  def submission_params(questionnaire)
    result = {}
    questionnaire.fields_list.each do |field|
      key = field["id"]
      next unless key.present?

      if field["type"] == "checkbox" || field["type"] == "acceptance" || field["type"] == "terms_and_conditions"
        result[key] = params[key].to_s == "true" || params[key] == "1"
      else
        result[key] = params[key] if params.key?(key)
      end
    end
    result
  end

  def valid_submission?(data, questionnaire)
    questionnaire.fields_list.each do |field|
      next unless field["required"]

      key = field["id"]
      value = data[key]

      case field["type"]
      when "checkbox", "acceptance", "terms_and_conditions"
        return false unless value == true
      else
        return false if value.blank?
      end
    end
    true
  end

  def serialize_questionnaire(q)
    {
      id: q.id,
      name: q.name,
      description: q.description,
      fields: q.fields_list
    }
  end
end
