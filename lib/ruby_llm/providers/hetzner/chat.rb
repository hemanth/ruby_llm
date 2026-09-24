# frozen_string_literal: true

module RubyLLM
  module Providers
    class Hetzner
      # Chat methods of the Hetzner Inference API integration
      module Chat
        module_function

        def format_role(role)
          role.to_s
        end

        def format_content(content, attachments = [])
          Protocols::ChatCompletions::Media.format_content(
            content,
            attachments,
            document_attachments: :none,
            image_attachments: true,
            audio_attachments: false
          )
        end
      end
    end
  end
end
