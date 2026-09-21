# frozen_string_literal: true

module RubyLLM
  # A probability-weighted position on a judgment's ordered levels.
  class Score
    include Support::Inspectable

    # Returns the weighted score, which can fall between level indexes.
    attr_reader :score

    # Returns the ordered descriptions, preserving structured Hashes and Arrays.
    attr_reader :levels

    # Returns each zero-based Integer level index's probability.
    attr_reader :probabilities

    # Returns the provider's confidence in the distribution, between 0 and 1.
    attr_reader :confidence

    def initialize(score:, levels:, probabilities:, confidence:) # :nodoc:
      @score = score
      @levels = Judge::Data.copy(levels)
      @probabilities = probabilities.dup.freeze
      @confidence = confidence
      freeze
    end

    # Returns :score.
    def type
      :score
    end

    # Returns the answer as a Hash.
    def to_h
      { type:, score:, levels:, probabilities:, confidence: }
    end

    def inspect_attributes # :nodoc:
      { score:, confidence: }
    end
  end
end
