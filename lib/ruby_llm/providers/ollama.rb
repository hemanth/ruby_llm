# frozen_string_literal: true

module RubyLLM
  module Providers
    # Ollama API integration. Handles chat completion, embeddings, models, streaming,
    # tools, images, and media for Ollama's API.
    module Ollama
      extend Provider
      extend Ollama::Chat
      extend Ollama::Embeddings
      extend Ollama::Models
      extend Ollama::Streaming
      extend Ollama::Tools
      extend Ollama::Images
      extend Ollama::Media

      module_function

      def api_base
        'http://127.0.0.1:11434'
      end

      def headers
        {}
      end

      def capabilities
        Ollama::Capabilities
      end

      def slug
        'ollama'
      end
    end
  end
end
