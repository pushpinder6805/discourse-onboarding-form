# frozen_string_literal: true

class CreateQuestionnaireDefinitions < ActiveRecord::Migration[6.1]
  def up
    return if table_exists?(:questionnaire_definitions)

    create_table :questionnaire_definitions do |t|
      t.string :name, null: false, default: ""
      t.text :description, default: ""
      t.json :fields, null: false, default: []
      t.boolean :enabled, null: false, default: true
      t.boolean :require_after_signup, null: false, default: true
      t.timestamps null: false
    end

    unless table_exists?(:onboarding_submissions)
      create_table :onboarding_submissions do |t|
        t.integer :user_id, null: false
        t.integer :questionnaire_id
        t.json :data, null: false, default: {}
        t.boolean :completed, null: false, default: false
        t.timestamps null: false
      end

      add_index :onboarding_submissions, :user_id unless index_exists?(:onboarding_submissions, :user_id)
      add_index :onboarding_submissions, :completed unless index_exists?(:onboarding_submissions, :completed)
      add_index :onboarding_submissions, :questionnaire_id unless index_exists?(:onboarding_submissions, :questionnaire_id)
    else
      unless column_exists?(:onboarding_submissions, :questionnaire_id)
        add_column :onboarding_submissions, :questionnaire_id, :integer
      end
      if column_exists?(:onboarding_submissions, :current_step)
        remove_column :onboarding_submissions, :current_step
      end
    end
  end

  def down
    drop_table :questionnaire_definitions if table_exists?(:questionnaire_definitions)
  end
end
