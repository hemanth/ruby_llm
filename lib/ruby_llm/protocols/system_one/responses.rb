# frozen_string_literal: true

module RubyLLM
  module Protocols
    class SystemOne
      module Responses # :nodoc:
        module_function

        def parse_judgment_response(response, questions:)
          body = response.body
          validate_judgment_response!(body, questions, response)
          answers = questions.values.to_h do |question|
            [question.name, parse_answer(body['answers'].fetch(question.name.to_s), question)]
          end
          usage = body['usage']
          RubyLLM::Judgment.new(
            answers:, model: body['model'], raw: response, model_info: @model,
            tokens: Tokens.new(input: usage['input_tokens'], output: usage['output_tokens'])
          )
        rescue ArgumentError, KeyError, TypeError => e
          raise Error.new("System One returned an invalid judgment: #{e.message}", response:)
        end

        def validate_judgment_response!(body, questions, response)
          raise Error.new('System One returned an invalid judgment response', response:) unless judgment_body?(body)
          unless body['answers'].keys.sort == questions.keys.sort
            raise Error.new('System One returned different question IDs from the request', response:)
          end

          %w[input_tokens output_tokens].each do |key|
            value = body['usage'][key]
            next if value.nil? || (value.is_a?(Integer) && value >= 0)

            raise Error.new("System One returned invalid #{key}", response:)
          end
        end

        def judgment_body?(body)
          body.is_a?(Hash) && body['model'].is_a?(String) && !body['model'].empty? &&
            body['answers'].is_a?(Hash) && body['usage'].is_a?(Hash)
        end

        def parse_answer(answer, question)
          unless answer.is_a?(Hash) && answer['type'] == Judgments::TYPES.fetch(question.type)
            raise ArgumentError, "Unexpected answer type for #{question.name}"
          end

          case question.type
          when :probability
            RubyLLM::Probability.new(probability: parse_probability(answer.fetch('noul')))
          when :choice then parse_choice(answer, question)
          when :score then parse_score(answer, question)
          end
        end

        def parse_choice(answer, question)
          options = question.criteria.keys.to_h { |key| [key.to_s, key] }
          RubyLLM::Choice.new(
            choice: options.fetch(answer.fetch('choice')),
            probabilities: parse_probabilities(answer.fetch('probabilities'), options),
            confidence: parse_probability(answer.fetch('confidence'))
          )
        end

        def parse_score(answer, question)
          indexes = question.criteria.each_index.to_h { |index| [index.to_s, index] }
          levels = parse_levels(answer.fetch('legend'), indexes)
          value = answer.fetch('score')
          unless finite_number?(value) && value.between?(0, indexes.size - 1)
            raise ArgumentError, "Invalid score for #{question.name}"
          end

          RubyLLM::Score.new(
            score: value, levels:,
            probabilities: parse_probabilities(answer.fetch('probabilities'), indexes),
            confidence: parse_probability(answer.fetch('confidence'))
          )
        end

        def parse_levels(legend, indexes)
          unless legend.is_a?(Hash) && legend.keys.sort == indexes.keys.sort
            raise ArgumentError, 'Unexpected score levels'
          end

          levels = indexes.keys.map { |key| legend.fetch(key) }
          unless levels.all? { |level| !level.nil? && Judge::Data.description?(level) }
            raise ArgumentError, 'Invalid score descriptions'
          end

          levels
        end

        def parse_probabilities(values, keys)
          unless values.is_a?(Hash) && values.keys.sort == keys.keys.sort
            raise ArgumentError, 'Unexpected probability distribution keys'
          end

          keys.to_h { |wire, key| [key, parse_probability(values.fetch(wire))] }
        end

        def parse_probability(value)
          return value if finite_number?(value) && value.between?(0, 1)

          raise ArgumentError, 'Probabilities and confidence must be numbers between 0 and 1'
        end

        def finite_number?(value)
          value.is_a?(Integer) || (value.is_a?(Float) && value.finite?)
        end
      end
    end
  end
end
