# frozen_string_literal: true

# ===========================================================================
# RubyLLM in-browser runtime for Ruby WASM & Web Playground
# Faithfully implements the RubyLLM 2.0 public API
# ===========================================================================

require 'json'
require 'time'
require 'ostruct'

module RubyLLM
  class Configuration
    attr_accessor :openai_api_key, :anthropic_api_key, :gemini_api_key,
                  :mistral_api_key, :cohere_api_key, :default_model

    def initialize
      @default_model = 'gpt-5.6-luna'
      @openai_api_key = 'simulated-key'
    end
  end

  class << self
    attr_writer :configuration

    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration) if block_given?
    end

    def chat(model: nil, **options)
      Chat.new(model: model || configuration.default_model, **options)
    end

    def paint(prompt, model: 'dall-e-3', **options)
      puts "[RUBYLLM::PAINT] Generating image with #{model}: \"#{prompt}\""
      Image.new(
        prompt: prompt,
        model: model,
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80",
        revised_prompt: "A photorealistic and expressive rendering: #{prompt}"
      )
    end

    def animate(prompt, model: 'sora-2', **options)
      puts "[RUBYLLM::ANIMATE] Generating video with #{model}: \"#{prompt}\""
      Video.new(
        prompt: prompt,
        model: model,
        url: "https://assets.rubyllm.com/video-demo.mp4",
        status: :completed,
        duration_seconds: 5.0
      )
    end

    def speak(text, voice: 'alloy', model: 'tts-1-hd', **options)
      puts "[RUBYLLM::SPEAK] Synthesizing speech (#{voice}): \"#{text}\""
      Speech.new(
        text: text,
        voice: voice,
        model: model,
        duration_seconds: (text.split.size * 0.4).round(1)
      )
    end

    def transcribe(audio_path, model: 'whisper-large-v3', **options)
      puts "[RUBYLLM::TRANSCRIBE] Transcribing audio from #{audio_path}"
      sample = "RubyLLM provides an idiomatic and unified interface across all major AI providers."
      Transcription.new(
        text: sample,
        language: 'en',
        segments: [
          { start: 0.0, end: 2.5, text: "RubyLLM provides an idiomatic" },
          { start: 2.5, end: 5.1, text: "and unified interface across all major AI providers." }
        ]
      )
    end

    def ocr(document_path, model: 'mistral-ocr', **options)
      puts "[RUBYLLM::OCR] Extracting structured text from #{document_path}"
      markdown = <<~MD
        # Invoice #INV-2026-042
        **Date:** 2026-09-21
        **Client:** Acme Corp

        | Description | Qty | Rate | Amount |
        |---|---|---|---|
        | AI Architecture Review | 10 hrs | $250.00 | $2,500.00 |
        | RubyLLM Enterprise Integration | 1 | $5,000.00 | $5,000.00 |

        **Total Due:** $7,500.00
      MD
      OCRDocument.new(markdown: markdown, path: document_path)
    end

    def moderate(content, model: 'omni-moderation-latest', **options)
      puts "[RUBYLLM::MODERATE] Checking safety for #{content.inspect[0..40]}..."
      ModerationResult.new(
        flagged: false,
        categories: { 'harassment' => false, 'hate' => false, 'violence' => false },
        category_scores: { 'harassment' => 0.001, 'hate' => 0.0004, 'violence' => 0.002 }
      )
    end

    def embed(text, model: 'text-embedding-3-small', **options)
      puts "[RUBYLLM::EMBED] Computing vector embeddings (#{model})"
      # 8-dimensional simulated vector preview
      vec = Array.new(8) { (rand - 0.5).round(4) }
      Embedding.new(text: text, vectors: vec, dimensions: 1536)
    end

    def rerank(query, documents, model: 'rerank-v3.5', **options)
      puts "[RUBYLLM::RERANK] Reranking #{documents.size} documents for query: \"#{query}\""
      scored = documents.each_with_index.map do |doc, idx|
        # Simulated relevance score
        rel = (0.95 - (idx * 0.22) + (rand * 0.05)).clamp(0.1, 0.99).round(4)
        RerankItem.new(document: doc, index: idx, relevance_score: rel)
      end.sort_by { |item| -item.relevance_score }
      RerankResult.new(query: query, results: scored)
    end

    def count_tokens(text_or_messages, model: 'gpt-5.6-luna')
      str = text_or_messages.is_a?(Array) ? text_or_messages.map { |m| m[:content] || m.content }.join(' ') : text_or_messages.to_s
      (str.split.size * 1.33).ceil
    end

    def models
      ModelsRegistry.new
    end
  end

  # =========================================================================
  # Value Objects
  # =========================================================================

  class Tokens
    attr_reader :input, :output, :cache_read, :cache_write

    def initialize(input: 0, output: 0, cache_read: 0, cache_write: 0)
      @input = input
      @output = output
      @cache_read = cache_read
      @cache_write = cache_write
    end

    def total
      @input + @output
    end

    def to_s
      "Tokens(in: #{@input}, out: #{@output}, total: #{total})"
    end
  end

  class Cost
    attr_reader :amount, :currency

    def initialize(amount = 0.00042, currency = 'USD')
      @amount = amount
      @currency = currency
    end

    def to_s
      "$#{format('%.6f', @amount)} #{@currency}"
    end
  end

  class Citation
    attr_reader :source, :title, :text

    def initialize(source:, title:, text:)
      @source = source
      @title = title
      @text = text
    end

    def to_s
      "[#{@title}] (#{@source}): #{@text}"
    end
  end

  class Chunk
    attr_reader :content, :role

    def initialize(content, role: :assistant)
      @content = content
      @role = role
    end
  end

  class Image
    attr_reader :prompt, :model, :url, :revised_prompt

    def initialize(prompt:, model:, url:, revised_prompt:)
      @prompt = prompt
      @model = model
      @url = url
      @revised_prompt = revised_prompt
    end

    def save(path)
      puts "[IMAGE] Saved #{@model} image to #{path} (URL: #{@url})"
      path
    end
  end

  class Video
    attr_reader :prompt, :model, :url, :status, :duration_seconds

    def initialize(prompt:, model:, url:, status:, duration_seconds:)
      @prompt = prompt
      @model = model
      @url = url
      @status = status
      @duration_seconds = duration_seconds
    end

    def save(path)
      puts "[VIDEO] Saved #{@model} video (#{duration_seconds}s) to #{path}"
      path
    end
  end

  class Speech
    attr_reader :text, :voice, :model, :duration_seconds

    def initialize(text:, voice:, model:, duration_seconds:)
      @text = text
      @voice = voice
      @model = model
      @duration_seconds = duration_seconds
    end

    def save(path)
      puts "[AUDIO] Saved speech (#{duration_seconds}s, voice '#{voice}') to #{path}"
      path
    end
  end

  class Transcription
    attr_reader :text, :language, :segments

    def initialize(text:, language:, segments:)
      @text = text
      @language = language
      @segments = segments
    end
  end

  class OCRDocument
    attr_reader :markdown, :path

    def initialize(markdown:, path:)
      @markdown = markdown
      @path = path
    end
  end

  class ModerationResult
    attr_reader :categories, :category_scores

    def initialize(flagged:, categories:, category_scores:)
      @flagged = flagged
      @categories = categories
      @category_scores = category_scores
    end

    def flagged?
      @flagged
    end
  end

  class Embedding
    attr_reader :text, :vectors, :dimensions

    def initialize(text:, vectors:, dimensions:)
      @text = text
      @vectors = vectors
      @dimensions = dimensions
    end
  end

  RerankItem = Struct.new(:document, :index, :relevance_score, keyword_init: true)
  RerankResult = Struct.new(:query, :results, keyword_init: true)

  class ModelsRegistry
    def find(model_id)
      OpenStruct.new(
        id: model_id,
        provider: 'openai',
        supports?: ->(cap) { true }
      )
    end
  end

  # =========================================================================
  # Messages
  # =========================================================================

  class Message
    attr_reader :role, :content, :thinking, :citations, :tokens, :parsed, :tool_calls

    def initialize(role:, content:, thinking: nil, citations: [], tokens: nil, parsed: nil, tool_calls: [])
      @role = role.to_sym
      @content = content
      @thinking = thinking
      @citations = citations
      @tokens = tokens || Tokens.new(input: 15, output: 45)
      @parsed = parsed
      @tool_calls = tool_calls
    end

    def user?
      @role == :user
    end

    def assistant?
      @role == :assistant
    end

    def system?
      @role == :system
    end

    def tool?
      @role == :tool
    end

    def to_s
      "[#{@role.to_s.upcase}] #{@content}"
    end
  end

  # =========================================================================
  # Tool Call & Tool Base
  # =========================================================================

  class ToolCall
    attr_reader :id, :name, :arguments, :status

    def initialize(id:, name:, arguments:, requires_approval: false)
      @id = id
      @name = name
      @arguments = arguments
      @requires_approval = requires_approval
      @status = requires_approval ? :pending_approval : :ready
    end

    def remote?
      false
    end

    def approve!
      @status = :approved
    end

    def reject!
      @status = :rejected
    end
  end

  class Tool
    class << self
      attr_reader :tool_description, :tool_params, :needs_approval

      def description(desc = nil)
        @tool_description = desc if desc
        @tool_description
      end

      def param(name, type: :string, desc: nil, required: true)
        @tool_params ||= {}
        @tool_params[name] = { type: type, desc: desc, required: required }
      end

      def requires_approval(val = true)
        @needs_approval = val
      end
    end

    def execute(**args)
      raise NotImplementedError, "#{self.class}#execute must be implemented"
    end
  end

  # =========================================================================
  # Chat Engine
  # =========================================================================

  class Chat
    attr_reader :model, :messages, :instructions, :temperature, :tools,
                :thinking_config, :caching_enabled, :citations_enabled,
                :compaction_enabled, :schema, :pending_tool_calls, :fallbacks

    def initialize(model: 'gpt-5.6-luna', instructions: nil, temperature: nil, tools: [])
      @model = model
      @instructions = instructions
      @temperature = temperature
      @tools = Array(tools).flatten
      @messages = []
      @thinking_config = nil
      @caching_enabled = false
      @citations_enabled = false
      @compaction_enabled = false
      @schema = nil
      @fallbacks = []
      @pending_tool_calls = []
      @tokens = Tokens.new(input: 0, output: 0)
      @cost = Cost.new(0.0)

      @messages << Message.new(role: :system, content: @instructions) if @instructions
    end

    def with_instructions(instructions)
      @instructions = instructions
      @messages << Message.new(role: :system, content: instructions) if instructions
      self
    end

    def with_temperature(temperature)
      @temperature = temperature
      self
    end

    def with_tools(*tools)
      @tools = tools.flatten
      self
    end

    def with_thinking(effort: :medium)
      @thinking_config = { effort: effort }
      self
    end

    def with_caching(enabled = true)
      @caching_enabled = enabled
      self
    end

    def with_citations(enabled = true)
      @citations_enabled = enabled
      self
    end

    def with_compaction(enabled = true)
      @compaction_enabled = enabled
      self
    end

    def with_schema(schema)
      @schema = schema
      self
    end

    def with_fallbacks(*models)
      @fallbacks = models.flatten
      self
    end

    def with_provider_tools(*tools)
      puts "[CHAT] Enabled provider-native tools: #{tools.join(', ')}"
      self
    end

    def tokens
      in_tok = @messages.sum { |m| m.tokens&.input || 0 }
      out_tok = @messages.sum { |m| m.tokens&.output || 0 }
      Tokens.new(input: in_tok, output: out_tok)
    end

    def cost
      Cost.new((tokens.total * 0.000003).round(6))
    end

    def ask(prompt = nil, with: nil, &block)
      if prompt
        user_msg = Message.new(role: :user, content: prompt)
        @messages << user_msg
        puts "[USER] #{prompt}#{with ? " (with attachment: #{with})" : ''}"
      end

      # Check for registered tools
      if @tools.any?
        tool_class = @tools.first
        if tool_class.is_a?(Class) && tool_class < Tool
          tool_inst = tool_class.new
          # Check approval requirement
          if tool_class.needs_approval && @pending_tool_calls.none? { |c| c.status == :approved }
            call = ToolCall.new(id: "call_#{rand(1000..9999)}", name: tool_class.name, arguments: { query: prompt }, requires_approval: true)
            @pending_tool_calls << call
            puts "[HITL] Paused: Tool #{tool_class.name} requires human approval (Call ID: #{call.id})"
            return Message.new(role: :assistant, content: "Tool #{tool_class.name} requires approval before proceeding.", tool_calls: [call])
          end

          # Execute tool
          tool_result = execute_simulated_tool(tool_inst, prompt)
          puts "[TOOL] Executed #{tool_class.name} -> #{tool_result.inspect}"
          @messages << Message.new(role: :tool, content: tool_result.to_json)
        end
      end

      # Generate assistant response (Live API if available, else simulation)
      thought_text = nil
      if @thinking_config
        thought_text = "Considering the request '#{prompt}' with #{@thinking_config[:effort]} effort...\nEvaluating best Ruby idioms."
      end

      citations_list = []
      if @citations_enabled
        citations_list << Citation.new(source: 'https://rubyllm.com/docs', title: 'RubyLLM Official Guide', text: 'RubyLLM coordinates chat, tools, and agents.')
      end

      # Attempt live LLM execution via proxy if no local tools or schema intercept
      live_result = nil
      if @tools.empty? && @schema.nil?
        live_result = call_proxy_chat
      end

      if live_result && live_result['content']
        response_content = live_result['content']
        in_tok = live_result.dig('tokens', 'input') || (prompt.to_s.length / 3).clamp(10, 80)
        out_tok = live_result.dig('tokens', 'output') || (response_content.length / 3).clamp(20, 150)

        if block_given?
          chunks = response_content.scan(/\S+\s*/m)
          chunks.each do |sub|
            yield Chunk.new(sub)
          end
        end

        assistant_msg = Message.new(
          role: :assistant,
          content: response_content,
          thinking: thought_text,
          citations: citations_list,
          tokens: Tokens.new(input: in_tok, output: out_tok)
        )
        @messages << assistant_msg
        return assistant_msg
      end

      response_content = generate_smart_response(prompt)

      # Handle streaming blocks
      if block_given?
        chunks = response_content.scan(/.{1,12}/m)
        chunks.each do |sub|
          yield Chunk.new(sub)
        end
      end

      parsed_obj = nil
      if @schema
        parsed_obj = generate_schema_response(@schema, prompt)
      end

      assistant_msg = Message.new(
        role: :assistant,
        content: response_content,
        thinking: thought_text,
        citations: citations_list,
        parsed: parsed_obj,
        tokens: Tokens.new(input: (prompt.to_s.length / 3).clamp(10, 80), output: (response_content.length / 3).clamp(20, 150))
      )
      @messages << assistant_msg
      assistant_msg
    end

    def call_proxy_chat
      return nil unless defined?(JS) && JS.global[:window] && JS.global[:window][:__rubyLLMProxyChat]

      msgs = @messages.map do |m|
        { role: m.role.to_s, content: m.content.to_s }
      end

      payload = {
        model: @model,
        messages: msgs,
        temperature: @temperature
      }.to_json

      raw = JS.global[:window].call(:__rubyLLMProxyChat, payload).to_s
      data = JSON.parse(raw)
      return nil if data['simulated'] || data['error']
      data
    rescue => e
      nil
    end

    def ask_later(prompt = nil, with: nil)
      @messages << Message.new(role: :user, content: prompt) if prompt
      puts "[LOOP] Queued turn: #{prompt.inspect}"
      self
    end

    def step
      puts "[LOOP] Stepping agentic loop..."
      ask
    end

    def complete?
      @pending_tool_calls.empty? || @pending_tool_calls.all? { |c| c.status != :pending_approval }
    end

    def approve(call_id)
      call = @pending_tool_calls.find { |c| c.id == call_id }
      if call
        call.approve!
        puts "[APPROVAL] Approved tool call #{call_id}"
      else
        puts "[APPROVAL] Warning: No pending tool call found for #{call_id}"
      end
    end

    def reject(call_id)
      call = @pending_tool_calls.find { |c| c.id == call_id }
      if call
        call.reject!
        puts "[APPROVAL] Rejected tool call #{call_id}"
      end
    end

    private

    def execute_simulated_tool(tool_inst, prompt)
      # Extract simple numbers or strings if applicable
      if tool_inst.class.name.downcase.include?('weather')
        { location: 'Berlin', temperature_c: 18.5, condition: 'Partly Cloudy', wind_kmh: 12.0 }
      elsif tool_inst.class.name.downcase.include?('calc')
        { expression: prompt, result: 42 }
      else
        { status: 'success', tool: tool_inst.class.name, query: prompt }
      end
    end

    def generate_smart_response(prompt)
      p_down = prompt.to_s.downcase
      if p_down.include?('weather')
        "The current weather in Berlin is 18.5°C with partly cloudy skies and a gentle 12 km/h breeze."
      elsif p_down.include?('story')
        "Once upon a time in 1995, Matz designed Ruby to optimize for programmer happiness. Decades later, RubyLLM brings that same joy to AI agents."
      elsif p_down.include?('ruby')
        "Ruby is an elegant, dynamic, open-source programming language with a focus on simplicity and productivity. With RubyLLM, building AI agents feels natural and expressive."
      elsif p_down.include?('analyze') || p_down.include?('product')
        "Based on the analysis, this product is well-engineered with high reliability and straightforward integration."
      elsif p_down.include?('active record') || p_down.include?('rails')
        "Active Record integrates seamlessly with RubyLLM via acts_as_chat and acts_as_message. Chats and messages persist cleanly in your application database."
      else
        "RubyLLM processed your request using #{@model}: \"#{prompt}\". Every model, tool, and operation follows the Ruby way."
      end
    end

    def generate_schema_response(schema_class, prompt)
      OpenStruct.new(
        name: "Pro Developer Keyboard",
        price: 149.99,
        features: ["Mechanical Hot-swap switches", "Custom RGB", "QMK/VIA Programmable"]
      )
    end
  end

  # =========================================================================
  # Agents DSL
  # =========================================================================

  class Agent
    class << self
      attr_reader :agent_model, :agent_instructions, :agent_tools, :agent_temperature

      def model(name = nil)
        @agent_model = name if name
        @agent_model || 'gpt-5.6-luna'
      end

      def instructions(text = nil)
        @agent_instructions = text if text
        @agent_instructions
      end

      def tools(*tool_list)
        @agent_tools = tool_list.flatten if tool_list.any?
        @agent_tools || []
      end

      def temperature(val = nil)
        @agent_temperature = val if val
        @agent_temperature
      end
    end

    attr_reader :chat

    def initialize(**overrides)
      model_to_use = overrides[:model] || self.class.agent_model || 'gpt-5.6-luna'
      instr_to_use = overrides[:instructions] || self.class.agent_instructions
      tools_to_use = overrides[:tools] || self.class.agent_tools || []
      temp_to_use  = overrides[:temperature] || self.class.agent_temperature

      @chat = RubyLLM.chat(model: model_to_use)
      @chat.with_instructions(instr_to_use) if instr_to_use
      @chat.with_temperature(temp_to_use) if temp_to_use
      @chat.with_tools(*tools_to_use) if tools_to_use.any?
    end

    def ask(prompt = nil, with: nil, &block)
      @chat.ask(prompt, with: with, &block)
    end
  end
end

# ===========================================================================
# Schematist Mock for Structured Output
# ===========================================================================

module Schematist
  class Schema
    class << self
      def string(name = nil); end
      def number(name = nil); end
      def boolean(name = nil); end
      def array(name = nil, &block); end
    end
  end
end

# ===========================================================================
# Rails on the Web: In-Memory Active Record Simulator
# ===========================================================================

module ActiveRecord
  class Relation
    include Enumerable

    def initialize(records)
      @records = records
    end

    def each(&block)
      @records.each(&block)
    end

    def where(conditions = {})
      filtered = @records.filter do |r|
        conditions.all? { |k, v| r.send(k) == v }
      end
      Relation.new(filtered)
    end

    def count
      @records.size
    end

    def first
      @records.first
    end

    def last
      @records.last
    end

    def to_a
      @records
    end
  end

  class Base
    class << self
      def store
        @store ||= []
      end

      def create(attrs = {})
        instance = new(attrs)
        instance.save
        instance
      end

      def create!(attrs = {})
        create(attrs)
      end

      def all
        Relation.new(store)
      end

      def where(conditions = {})
        all.where(conditions)
      end

      def count
        store.size
      end

      def first
        store.first
      end

      def last
        store.last
      end

      def destroy_all
        store.clear
      end

      def acts_as_chat
        include ActsAsChatMethods
      end

      def acts_as_message
        include ActsAsMessageMethods
      end
    end

    attr_accessor :id, :created_at, :updated_at

    def initialize(attrs = {})
      @attributes = attrs.transform_keys(&:to_sym)
      @id = self.class.store.size + 1
      @created_at = Time.now
      @updated_at = Time.now
      @attributes.each do |k, v|
        define_singleton_method(k) { @attributes[k] }
        define_singleton_method("#{k}=") { |val| @attributes[k] = val }
      end
    end

    def save
      self.class.store << self unless self.class.store.include?(self)
      true
    end
  end

  module ActsAsChatMethods
    def messages
      Relation.new(MessageRecord.store.select { |m| m.chat_id == id })
    end

    def ask(prompt, with: nil, &block)
      # Persist user message
      user_rec = MessageRecord.create(
        chat_id: id,
        role: :user,
        content: prompt
      )

      # Run chat turn
      chat_engine = RubyLLM.chat(model: try_attr(:model) || 'gpt-5.6-luna')
      messages.each do |prev|
        chat_engine.messages << RubyLLM::Message.new(role: prev.role, content: prev.content)
      end
      response = chat_engine.ask(prompt, with: with, &block)

      # Persist assistant message
      asst_rec = MessageRecord.create(
        chat_id: id,
        role: :assistant,
        content: response.content
      )
      response
    end

    def tokens
      in_tok = messages.sum { |m| m.role == :user ? m.content.length / 3 : 0 }
      out_tok = messages.sum { |m| m.role == :assistant ? m.content.length / 3 : 0 }
      RubyLLM::Tokens.new(input: in_tok, output: out_tok)
    end

    def cost
      RubyLLM::Cost.new((tokens.total * 0.000003).round(6))
    end

    private

    def try_attr(name)
      respond_to?(name) ? send(name) : nil
    end
  end

  module ActsAsMessageMethods
    def chat
      ChatRecord.store.find { |c| c.id == chat_id }
    end
  end
end

class ApplicationRecord < ActiveRecord::Base
  # In Rails apps, models inherit from ApplicationRecord
end

# Default pre-defined Chat and Message models for Rails lessons
class ChatRecord < ApplicationRecord
  acts_as_chat
end

class MessageRecord < ApplicationRecord
  acts_as_message
end

# Make Chat and Message available directly as Rails models
Chat = ChatRecord unless defined?(Chat)
Message = MessageRecord unless defined?(Message)

