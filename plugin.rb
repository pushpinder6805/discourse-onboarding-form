# frozen_string_literal: true

# name: discourse-onboarding-form
# about: Onboarding questionnaire after signup
# version: 0.1
# authors: Pushpender

enabled_site_setting :onboarding_enabled

after_initialize do
  module ::DiscourseOnboarding
    PLUGIN_NAME = "discourse-onboarding-form"
  end

  require_relative "app/models/onboarding_submission"
  require_relative "app/controllers/onboarding_controller"
  require_relative "app/controllers/admin/onboarding_controller"
end
