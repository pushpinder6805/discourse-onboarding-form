# frozen_string_literal: true

class QuestionnaireDefinition < ActiveRecord::Base
  has_many :onboarding_submissions, foreign_key: :questionnaire_id, dependent: :nullify

  validates :name, presence: true

  FIELD_TYPES = %w[text textarea phone number checkbox acceptance terms_and_conditions].freeze

  def self.active
    where(enabled: true, require_after_signup: true).order(created_at: :desc).first
  end

  def fields_list
    (self.fields || []).map(&:with_indifferent_access)
  end
end
