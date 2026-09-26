# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RubyLLM::Context do
  subject(:context) { described_class.new(RubyLLM::Configuration.new) }

  it 'counts tokens through a context-bound chat' do
    chat = instance_double(RubyLLM::Chat, count_tokens: 12)
    allow(RubyLLM::Chat).to receive(:new).with(model: 'model', provider: :openai, context:).and_return(chat)

    expect(context.count_tokens('Hello', model: 'model', provider: :openai)).to eq(12)
  end

  it 'stages embedding requests with the context' do
    request = instance_double(RubyLLM::EmbeddingRequest)
    allow(RubyLLM::EmbeddingRequest).to receive(:new)
      .with('Hello', model: 'model', provider: :openai, dimensions: 256, context:)
      .and_return(request)

    expect(context.embed_later('Hello', model: 'model', provider: :openai, dimensions: 256)).to be(request)
  end

  it 'connects to MCP servers with the context' do
    url = 'https://mcp.example.com/mcp'
    mcp_class = Class.new(RubyLLM::MCP)
    allow(RubyLLM::MCP).to receive(:define).with(url:, prefix: 'docs').and_return(mcp_class)
    allow(mcp_class).to receive(:new).and_call_original

    expect(context.mcp(url:, prefix: 'docs')).to be_a(mcp_class)
    expect(mcp_class).to have_received(:new).with(context:)
  end

  it 'extracts text with the context' do
    allow(RubyLLM::OCR).to receive(:ocr).with('report.pdf', model: 'model', context:).and_return(:ocr)

    expect(context.ocr('report.pdf', model: 'model')).to eq(:ocr)
  end

  it 'reranks documents with the context' do
    allow(RubyLLM::Rerank).to receive(:rerank)
      .with('query', %w[first second], model: 'model', context:)
      .and_return(:reranked)

    expect(context.rerank('query', %w[first second], model: 'model')).to eq(:reranked)
  end
end
