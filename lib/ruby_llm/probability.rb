# frozen_string_literal: true

module RubyLLM
  # The probability that a judgment's yes/no question is true.
  class Probability
    include Support::Inspectable

    # Returns the probability of yes, between 0 and 1.
    attr_reader :probability

    def initialize(probability:) # :nodoc:
      @probability = probability
      freeze
    end

    # Returns :probability.
    def type
      :probability
    end

    # Returns the answer as a Hash.
    def to_h
      { type:, probability: }
    end

    def inspect_attributes # :nodoc:
      { probability: }
    end
  end
end
