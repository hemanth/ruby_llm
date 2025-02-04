# RubyLLM

A delightful Ruby interface to the latest large language models. Stop wrestling with multiple APIs and inconsistent interfaces. RubyLLM gives you a clean, unified way to work with models from OpenAI, Anthropic, and more.

[![Gem Version](https://badge.fury.io/rb/ruby_llm.svg)](https://badge.fury.io/rb/ruby_llm)
[![Ruby Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/testdouble/standard)

## Installation

Add it to your Gemfile:

```ruby
gem 'ruby_llm'
```

Or install it yourself:

```bash
gem install ruby_llm
```

## Quick Start

RubyLLM makes it dead simple to start chatting with AI models:

```ruby
require 'ruby_llm'

# Configure your API keys
RubyLLM.configure do |config|
  config.openai_api_key = ENV['OPENAI_API_KEY']
  config.anthropic_api_key = ENV['ANTHROPIC_API_KEY']
end

# Start a conversation
chat = RubyLLM.chat
chat.ask "What's the best way to learn Ruby?"
```

## Available Models

RubyLLM gives you access to the latest models from multiple providers:

```ruby
# List all available models
RubyLLM.models.all

# Get models by type
chat_models = RubyLLM.models.chat_models
embedding_models = RubyLLM.models.embedding_models
audio_models = RubyLLM.models.audio_models
image_models = RubyLLM.models.image_models
```

## Having a Conversation

Conversations are simple and natural, with automatic token counting built right in:

```ruby
chat = RubyLLM.chat model: 'claude-3-5-sonnet-20241022'

# Single messages with token tracking
response = chat.ask "What's your favorite Ruby feature?"
puts "Response used #{response.input_tokens} input tokens and #{response.output_tokens} output tokens"

# Multi-turn conversations just work
chat.ask "Can you elaborate on that?"
chat.ask "How does that compare to Python?"

# Stream responses as they come
chat.ask "Tell me a story about a Ruby programmer" do |chunk|
  print chunk.content
end

# Get token usage for the whole conversation from the last message
last_message = chat.messages.last
puts "Conversation used #{last_message.input_tokens} input tokens and #{last_message.output_tokens} output tokens"
```

## Using Tools

Give your AI assistants access to your Ruby code by creating tool classes that do one thing well:

```ruby
class Calculator < RubyLLM::Tool
  description "Performs arithmetic calculations"

  param :expression,
    type: :string,
    desc: "A mathematical expression to evaluate (e.g. '2 + 2')"

  def execute(expression:)
    eval(expression).to_s
  end
end

class Search < RubyLLM::Tool
  description "Searches documents by similarity"

  param :query,
    desc: "The search query"

  param :limit,
    type: :integer,
    desc: "Number of results to return",
    required: false

  def initialize(repo:)
    @repo = repo
  end

  def execute(query:, limit: 5)
    @repo.similarity_search(query, limit:)
  end
end
```

Then use them in your conversations:

```ruby
# Simple tools just work
chat = RubyLLM.chat.with_tool Calculator

# Tools with dependencies are just regular Ruby objects
search = Search.new repo: Document
chat.with_tools search, CalculatorTool

# Need more control? Configure as needed
chat.with_model('claude-3-5-sonnet-20241022')
    .with_temperature(0.9)

chat.ask "What's 2+2?"
# => "Let me calculate that for you. The result is 4."

chat.ask "Find documents about Ruby performance"
# => "I found these relevant documents about Ruby performance..."
```

Tools let you seamlessly integrate your Ruby code with AI capabilities. The model will automatically decide when to use your tools and handle the results appropriately.

Need to debug a tool? RubyLLM automatically logs all tool calls and their results when debug logging is enabled:

```ruby
ENV['RUBY_LLM_DEBUG'] = 'true'

chat.ask "What's 123 * 456?"
# D, -- RubyLLM: Tool calculator called with: {"expression" => "123 * 456"}
# D, -- RubyLLM: Tool calculator returned: "56088"
```

Create tools for anything - database queries, API calls, custom business logic - and let Claude use them naturally in conversation.

## Coming Soon

- Rails integration for seamless database and Active Record support
- Automatic retries and error handling
- Much more!

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `bin/console` for an interactive prompt.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/crmne/ruby_llm.

## License

Released under the MIT License. See LICENSE.txt for details.