# frozen_string_literal: true

require "csv"

class Admin::OnboardingController < ::Admin::AdminController
  requires_plugin "discourse-onboarding-form"

  def index
    questionnaires = QuestionnaireDefinition.order(created_at: :desc)
    render json: {
      questionnaires: questionnaires.map { |q| serialize_questionnaire(q) }
    }
  end

  def create_questionnaire
    questionnaire = QuestionnaireDefinition.new(questionnaire_params)
    if questionnaire.save
      render json: { questionnaire: serialize_questionnaire(questionnaire) }
    else
      render json: { errors: questionnaire.errors.full_messages }, status: 422
    end
  end

  def update_questionnaire
    questionnaire = QuestionnaireDefinition.find(params[:id])
    if questionnaire.update(questionnaire_params)
      render json: { questionnaire: serialize_questionnaire(questionnaire) }
    else
      render json: { errors: questionnaire.errors.full_messages }, status: 422
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: 404
  end

  def destroy_questionnaire
    questionnaire = QuestionnaireDefinition.find(params[:id])
    questionnaire.destroy
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: 404
  end

  def submissions
    page = (params[:page] || 0).to_i
    per_page = 50

    query = OnboardingSubmission.includes(:user, :questionnaire_definition).order(created_at: :desc)

    if params[:search].present?
      search_term = "%#{params[:search].downcase}%"
      query = query.joins(:user).where(
        "lower(users.username) LIKE ? OR lower(users.email) LIKE ?",
        search_term, search_term
      )
    end

    total = query.count
    records = query.offset(page * per_page).limit(per_page)

    render json: {
      submissions: records.map { |s| serialize_submission(s) },
      total: total,
      page: page,
      per_page: per_page
    }
  end

  def show
    submission = OnboardingSubmission.includes(:user, :questionnaire_definition).find(params[:id])
    render json: { submission: serialize_submission(submission) }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: 404
  end

  def destroy
    submission = OnboardingSubmission.find(params[:id])
    submission.destroy
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: 404
  end

  def export
    questionnaire_id = params[:questionnaire_id]
    submissions_query = OnboardingSubmission.includes(:user, :questionnaire_definition).where(completed: true)
    submissions_query = submissions_query.where(questionnaire_id: questionnaire_id) if questionnaire_id.present?
    submissions_list = submissions_query.order(created_at: :desc)

    all_field_keys = []
    all_field_labels = {}

    submissions_list.each do |s|
      fields = s.questionnaire_definition&.fields_list || []
      fields.each do |f|
        key = f["id"]
        next unless key
        unless all_field_keys.include?(key)
          all_field_keys << key
          all_field_labels[key] = f["label"] || key
        end
      end
    end

    csv_data = CSV.generate(headers: true) do |csv|
      header = ["Username", "Email", "Questionnaire", "Completed At"] + all_field_keys.map { |k| all_field_labels[k] }
      csv << header

      submissions_list.each do |s|
        d = s.data || {}
        row = [
          s.user&.username,
          s.user&.email,
          s.questionnaire_definition&.name || "Unknown",
          s.updated_at&.strftime("%Y-%m-%d %H:%M:%S")
        ]
        all_field_keys.each { |k| row << d[k].to_s }
        csv << row
      end
    end

    send_data csv_data,
      type: "text/csv; charset=utf-8",
      disposition: "attachment; filename=questionnaire_submissions_#{Date.today}.csv"
  end

  private

  def questionnaire_params
    result = params.require(:questionnaire).permit(:name, :description, :enabled, :require_after_signup)
    result[:fields] = params[:questionnaire][:fields] if params[:questionnaire][:fields]
    result
  end

  def serialize_questionnaire(q)
    {
      id: q.id,
      name: q.name,
      description: q.description,
      fields: q.fields_list,
      enabled: q.enabled,
      require_after_signup: q.require_after_signup,
      created_at: q.created_at,
      updated_at: q.updated_at,
      submission_count: OnboardingSubmission.where(questionnaire_id: q.id).count
    }
  end

  def serialize_submission(s)
    questionnaire_fields = s.questionnaire_definition&.fields_list || []
    {
      id: s.id,
      user_id: s.user_id,
      username: s.user&.username,
      email: s.user&.email,
      avatar_template: s.user&.avatar_template,
      completed: s.completed,
      data: s.data,
      questionnaire_id: s.questionnaire_id,
      questionnaire_name: s.questionnaire_definition&.name,
      questionnaire_fields: questionnaire_fields,
      created_at: s.created_at,
      updated_at: s.updated_at
    }
  end
end
