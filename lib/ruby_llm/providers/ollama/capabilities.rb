# frozen_string_literal: true

module RubyLLM
  module Providers
    module Ollama
      # Determines capabilities for Ollama models
      module Capabilities
        module_function

        # Determines the context window size for a given model
        # @param model_id [String] the model identifier
        # @return [Integer] the context window size in tokens
        def determine_context_window(model_id)
          case model_id
          when /ollama-chat/ then 4096
          when /ollama-embedding/ then 2048
          when /ollama-image/ then 4096
          else 4096 # Default context window size
          end
        end

        # Determines the maximum output tokens for a given model
        # @param model_id [String] the model identifier
        # @return [Integer] the maximum output tokens
        def determine_max_tokens(model_id)
          case model_id
          when /ollama-chat/ then 2048
          when /ollama-embedding/ then 1
          when /ollama-image/ then 4096
          else 2048 # Default max tokens
          end
        end

        # Determines if a model supports vision capabilities
        # @param model_id [String] the model identifier
        # @return [Boolean] true if the model supports vision
        def supports_vision?(model_id)
          model_id.match?(/ollama-image/)
        end

        # Determines if a model supports function calling
        # @param model_id [String] the model identifier
        # @return [Boolean] true if the model supports functions
        def supports_functions?(model_id)
          model_id.match?(/ollama-chat/)
        end

        # Determines if a model supports JSON mode
        # @param model_id [String] the model identifier
        # @return [Boolean] true if the model supports JSON mode
        def supports_json_mode?(model_id)
          model_id.match?(/ollama-chat/)
        end

        # Determines the model family for a given model ID
        # @param model_id [String] the model identifier
        # @return [Symbol] the model family identifier
        def model_family(model_id)
          case model_id
          when /ollama-chat/ then :ollama_chat
          when /ollama-embedding/ then :ollama_embedding
          when /ollama-image/ then :ollama_image
          else :ollama
          end
        end

        # Returns the model type
        # @param model_id [String] the model identifier
        # @return [String] the model type
        def model_type(model_id)
          case model_id
          when /ollama-chat/ then 'chat'
          when /ollama-embedding/ then 'embedding'
          when /ollama-image/ then 'image'
          else 'chat' # Default model type
          end
        end
      end
    end
  end
end
