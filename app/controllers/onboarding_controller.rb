# frozen_string_literal: true

class OnboardingController < ApplicationController
  requires_plugin "discourse-onboarding-form"
  before_action :ensure_logged_in
  before_action :ensure_onboarding_enabled

  def show
    submission = OnboardingSubmission.find_by(user_id: current_user.id)
    render json: {
      completed: submission&.completed || false,
      current_step: submission&.current_step || 1,
      data: submission&.data || {}
    }
  end

  def status
    submission = OnboardingSubmission.find_by(user_id: current_user.id)
    render json: {
      completed: submission&.completed || false,
      required: !submission&.completed
    }
  end

  def submit
    submission = OnboardingSubmission.for_user(current_user.id)
    submission.data = (submission.data || {}).merge(submission_params)
    submission.current_step = params[:current_step].to_i if params[:current_step]

    if params[:final_submit]
      if valid_final_submission?(submission.data)
        submission.completed = true
        sync_user_fields(submission.data)
      else
        return render json: { errors: ["Please complete all required fields."] }, status: 422
      end
    end

    if submission.save
      render json: { success: true, completed: submission.completed, current_step: submission.current_step }
    else
      render json: { errors: submission.errors.full_messages }, status: 422
    end
  end

  private

  def ensure_onboarding_enabled
    raise Discourse::NotFound unless SiteSetting.onboarding_enabled
  end

  def submission_params
    permitted = params.permit(
      :role,
      :first_name,
      :last_name,
      :pronouns,
      :phone,
      :alt_phone,
      :organization,
      :organization_type,
      :country,
      :state,
      :city,
      :zip,
      :agreed_to_terms,
      groups_served: [],
      states_worked: []
    )
    permitted.to_h
  end

  def valid_final_submission?(data)
    required_fields = %w[
      role first_name pronouns phone organization organization_type country state agreed_to_terms
    ]
    required_fields.all? { |f| data[f].present? } &&
      data["groups_served"].is_a?(Array) && data["groups_served"].any?
  end

  def sync_user_fields(data)
    return unless current_user

    user_profile = current_user.user_profile
    return unless user_profile

    user_profile.location = [data["city"], data["state"], data["country"]].compact.join(", ") if data["city"] || data["state"]
    user_profile.save

    if current_user.respond_to?(:custom_fields)
      current_user.custom_fields["onboarding_role"] = data["role"] if data["role"]
      current_user.custom_fields["onboarding_organization"] = data["organization"] if data["organization"]
      current_user.save_custom_fields
    end
  end
end
