# frozen_string_literal: true

class CreateOnboardingSubmissions < ActiveRecord::Migration[7.0]
  def change
    create_table :onboarding_submissions do |t|
      t.integer :user_id, null: false
      t.jsonb :data, null: false, default: {}
      t.boolean :completed, null: false, default: false
      t.integer :current_step, null: false, default: 1
      t.timestamps
    end

    add_index :onboarding_submissions, :user_id, unique: true
    add_index :onboarding_submissions, :completed
  end
end
