# frozen_string_literal: true

class CreateOnboardingSubmissions < ActiveRecord::Migration[6.1]
  def up
    return if table_exists?(:onboarding_submissions)

    create_table :onboarding_submissions do |t|
      t.integer :user_id, null: false
      t.json :data, null: false, default: {}
      t.boolean :completed, null: false, default: false
      t.integer :current_step, null: false, default: 1
      t.timestamps null: false
    end

    add_index :onboarding_submissions, :user_id, unique: true unless index_exists?(:onboarding_submissions, :user_id)
    add_index :onboarding_submissions, :completed unless index_exists?(:onboarding_submissions, :completed)
  end

  def down
    drop_table :onboarding_submissions if table_exists?(:onboarding_submissions)
  end
end
