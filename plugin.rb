# frozen_string_literal: true

# name: discourse-onboarding-form
# about: Dynamic questionnaire builder with admin panel, custom field types, and CSV export
# version: 2.0
# authors: Pushpender

enabled_site_setting :onboarding_enabled

register_asset "stylesheets/onboarding.scss"

after_initialize do
  module ::DiscourseOnboarding
    PLUGIN_NAME = "discourse-onboarding-form"
  end

  require_relative "app/models/questionnaire_definition"
  require_relative "app/models/onboarding_submission"
  require_relative "app/controllers/onboarding_controller"
  require_relative "app/controllers/admin/onboarding_controller"

  Discourse::Application.routes.draw do
    get "/questionnaire" => "onboarding#show"
    post "/questionnaire/submit" => "onboarding#submit"
    get "/questionnaire/status" => "onboarding#status"

    scope "/admin", constraints: StaffConstraint.new do
      get "plugins/onboarding" => "admin/onboarding#index"
      get "plugins/onboarding/questionnaires" => "admin/onboarding#index"
      post "plugins/onboarding/questionnaires" => "admin/onboarding#create_questionnaire"
      put "plugins/onboarding/questionnaires/:id" => "admin/onboarding#update_questionnaire"
      delete "plugins/onboarding/questionnaires/:id" => "admin/onboarding#destroy_questionnaire"
      get "plugins/onboarding/submissions" => "admin/onboarding#submissions"
      get "plugins/onboarding/submissions/export" => "admin/onboarding#export"
      get "plugins/onboarding/submissions/:id" => "admin/onboarding#show"
      delete "plugins/onboarding/submissions/:id" => "admin/onboarding#destroy"
    end
  end

  on(:user_created) do |user|
    if SiteSetting.onboarding_enabled
      questionnaire = QuestionnaireDefinition.active
      if questionnaire
        MessageBus.publish(
          "/questionnaire/redirect/#{user.id}",
          { redirect: "/questionnaire" },
          user_ids: [user.id]
        )
      end
    end
  end

  add_to_serializer(:current_user, :questionnaire_completed) do
    OnboardingSubmission.where(user_id: object.id, completed: true).exists?
  end

  add_to_serializer(:current_user, :questionnaire_required) do
    questionnaire = QuestionnaireDefinition.active
    return false unless questionnaire
    !OnboardingSubmission.where(user_id: object.id, completed: true).exists?
  end
end
