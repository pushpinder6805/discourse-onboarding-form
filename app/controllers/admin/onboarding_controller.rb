# frozen_string_literal: true

module Admin
  module Onboarding
    class OnboardingController < Admin::AdminController
      requires_plugin "discourse-onboarding-form"

      def index
        render json: { plugin: "discourse-onboarding-form", version: "1.0" }
      end

      def submissions
        page = (params[:page] || 0).to_i
        per_page = 50

        query = OnboardingSubmission.includes(:user).order(created_at: :desc)

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
        submission = OnboardingSubmission.includes(:user).find(params[:id])
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
        submissions = OnboardingSubmission.includes(:user).where(completed: true).order(created_at: :desc)

        csv_data = CSV.generate(headers: true) do |csv|
          csv << %w[
            Username Email Role Groups_Served States First_Name Last_Name
            Pronouns Phone Organization Organization_Type Country State City Zip
            Completed_At
          ]

          submissions.each do |s|
            d = s.data || {}
            csv << [
              s.user&.username,
              s.user&.email,
              d["role"],
              Array(d["groups_served"]).join("; "),
              Array(d["states_worked"]).join("; "),
              d["first_name"],
              d["last_name"],
              d["pronouns"],
              d["phone"],
              d["organization"],
              d["organization_type"],
              d["country"],
              d["state"],
              d["city"],
              d["zip"],
              s.updated_at&.strftime("%Y-%m-%d %H:%M:%S")
            ]
          end
        end

        send_data csv_data,
          type: "text/csv; charset=utf-8",
          disposition: "attachment; filename=onboarding_submissions_#{Date.today}.csv"
      end

      private

      def serialize_submission(s)
        {
          id: s.id,
          user_id: s.user_id,
          username: s.user&.username,
          email: s.user&.email,
          avatar_template: s.user&.avatar_template,
          completed: s.completed,
          current_step: s.current_step,
          data: s.data,
          created_at: s.created_at,
          updated_at: s.updated_at
        }
      end
    end
  end
end
