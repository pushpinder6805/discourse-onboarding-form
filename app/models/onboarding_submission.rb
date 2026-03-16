# frozen_string_literal: true

class OnboardingSubmission < ActiveRecord::Base
  belongs_to :user
  belongs_to :questionnaire_definition, optional: true, foreign_key: :questionnaire_id

  validates :user_id, presence: true

  def self.for_user(user_id, questionnaire_id = nil)
    record = find_or_initialize_by(user_id: user_id)
    record.questionnaire_id = questionnaire_id if questionnaire_id
    record
  end
end
