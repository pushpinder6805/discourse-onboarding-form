# frozen_string_literal: true

class OnboardingSubmission < ActiveRecord::Base
  belongs_to :user

  validates :user_id, presence: true, uniqueness: true
  validates :data, presence: true

  def self.for_user(user_id)
    find_or_initialize_by(user_id: user_id)
  end
end
