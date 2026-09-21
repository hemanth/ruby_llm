# frozen_string_literal: true

module RubyLLM
  module Protocols
    class SystemOne
      module Models # :nodoc:
        module_function

        def models_url
          'v1/models'
        end

        def parse_list_models_response(response, slug)
          body = response.body
          unless body.is_a?(Hash) && body['models'].is_a?(Array)
            raise Error.new('System One returned an invalid model catalog', response:)
          end

          body['models'].map do |entry|
            unless entry.is_a?(Hash) && entry['name'].is_a?(String) && !entry['name'].empty?
              raise Error.new('System One returned a model without a name', response:)
            end

            Model.new(
              id: entry['name'], name: entry['name'], provider: slug,
              created_at: entry['release_date'],
              modalities: { input: ['text'], output: ['judgment'] },
              capabilities: ['judgment'],
              metadata: { description: entry['description'] }.compact
            )
          end
        end
      end
    end
  end
end
