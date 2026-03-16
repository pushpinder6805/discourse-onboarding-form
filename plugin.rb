# frozen_string_literal: true

# name: discourse-onboarding-form
# about: Multi-step onboarding questionnaire after signup with admin panel
# version: 1.0
# authors: Pushpender

enabled_site_setting :onboarding_enabled

after_initialize do
  module ::DiscourseOnboarding
    PLUGIN_NAME = "discourse-onboarding-form"
  end

  require_relative "app/models/onboarding_submission"
  require_relative "app/controllers/onboarding_controller"
  require_relative "app/controllers/admin/onboarding_controller"

  Discourse::Application.routes.draw do
    get "/onboarding" => "onboarding#show"
    post "/onboarding/submit" => "onboarding#submit"
    get "/onboarding/status" => "onboarding#status"

    namespace :admin, constraints: StaffConstraint.new do
      get "plugins/onboarding" => "onboarding/onboarding#index"
      get "plugins/onboarding/submissions" => "onboarding/onboarding#submissions"
      get "plugins/onboarding/submissions/:id" => "onboarding/onboarding#show"
      delete "plugins/onboarding/submissions/:id" => "onboarding/onboarding#destroy"
      get "plugins/onboarding/export" => "onboarding/onboarding#export"
    end
  end

  on(:user_approved) do |user|
    if SiteSetting.onboarding_enabled
      submission = OnboardingSubmission.find_by(user_id: user.id)
      unless submission&.completed
        MessageBus.publish(
          "/onboarding/redirect/#{user.id}",
          { redirect: "/onboarding" },
          user_ids: [user.id]
        )
      end
    end
  end

  add_to_serializer(:current_user, :onboarding_completed) do
    OnboardingSubmission.where(user_id: object.id, completed: true).exists?
  end
end
