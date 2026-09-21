# frozen_string_literal: true

module RubyLLM
  # A selected judgment option and its full probability distribution.
  class Choice
    include Support::Inspectable

    # Returns the selected option, preserving its declared String or Symbol type.
    attr_reader :choice

    # Returns each declared option's probability.
    attr_reader :probabilities

    # Returns the provider's confidence in the distribution, between 0 and 1.
    attr_reader :confidence

    def initialize(choice:, probabilities:, confidence:) # :nodoc:
      @choice = choice.is_a?(String) ? choice.dup.freeze : choice
      @probabilities = probabilities.dup.freeze
      @confidence = confidence
      freeze
    end

    # Returns :choice.
    def type
      :choice
    end

    # Returns the answer as a Hash.
    def to_h
      { type:, choice:, probabilities:, confidence: }
    end

    def inspect_attributes # :nodoc:
      { choice:, confidence: }
    end
  end
end
