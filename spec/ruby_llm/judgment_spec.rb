# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RubyLLM::Judgment do
  let(:probability) { RubyLLM::Probability.new(probability: 0.9) }
  let(:choice) { RubyLLM::Choice.new(choice: 'Billing & payments', probabilities: { 'Billing & payments' => 1.0 }, confidence: 1.0) }
  let(:result) do
    described_class.new(answers: { urgent: probability, 'department' => choice },
                        model: model_for(:typesafe, :judgment), tokens: RubyLLM::Tokens.new(input: 20, output: 10))
  end

  it 'looks up answers by either String or Symbol without losing their declared names' do
    expect(result[:urgent]).to equal(result['urgent'])
    expect(result.fetch(:department)).to equal(choice)
    expect(result[:missing]).to be_nil
    expect { result.fetch(:missing) }.to raise_error(KeyError)
    expect(result.map { |name, answer| [name, answer.type] }).to eq([%i[urgent probability], ['department', :choice]])
  end

  it 'serializes answers without discarding their uncertainty' do
    expect(result.to_h).to include(
      model: model_for(:typesafe, :judgment),
      answers: {
        urgent: { type: :probability, probability: 0.9 },
        'department' => { type: :choice, choice: 'Billing & payments',
                          probabilities: { 'Billing & payments' => 1.0 }, confidence: 1.0 }
      }
    )
    expect(result.tokens.input).to eq(20)
    expect(result.cost.total).to be_nil
  end

  it 'exposes named answers as readers for String and Symbol question names' do
    expect(result.urgent).to equal(probability)
    expect(result.department).to equal(choice)
    expect(result.urgent.probability).to eq(0.9)
    expect(result).to respond_to(:urgent, :department)
    expect(result.method(:urgent).call).to equal(probability)
  end

  it 'does not hide unknown methods or accept arguments, blocks, or assignment' do
    expect(result).not_to respond_to(:missing, :urgent=)
    expect { result.missing }.to raise_error(NoMethodError)
    expect { result.urgent(1) }.to raise_error(NoMethodError)
    expect { result.urgent(value: 1) }.to raise_error(NoMethodError)
    expect { result.urgent { 1 } }.to raise_error(NoMethodError)
    expect { result.urgent = 1 }.to raise_error(NoMethodError)
  end

  it 'keeps existing methods when a question name collides with them' do
    result = described_class.new(answers: { model: probability, tokens: probability, 'Billing & payments' => choice },
                                 model: model_for(:typesafe, :judgment))

    expect(result.model).to eq(model_for(:typesafe, :judgment))
    expect(result.tokens).to be_a(RubyLLM::Tokens)
    expect(result[:model]).to equal(probability)
    expect(result[:tokens]).to equal(probability)
    expect(result['Billing & payments']).to equal(choice)
  end

  it 'keeps answers immutable and does not invent confidence for a yes/no probability' do
    expect(probability).to be_frozen
    expect(probability).not_to respond_to(:confidence)
    expect(choice.probabilities).to be_frozen
    expect(result.answers).to be_frozen
    expect(result.inspect).to include('RubyLLM::Judgment', 'answers:')
  end

  it 'preserves fractional scores and deeply freezes structured level descriptions' do
    levels = [{ description: +'Calm' }, ['Angry']]
    score = RubyLLM::Score.new(score: 0.4, levels:, probabilities: { 0 => 0.6, 1 => 0.4 }, confidence: 0.2)
    levels.first[:description].replace('Changed')

    expect(score.to_h).to eq(type: :score, score: 0.4, levels: [{ description: 'Calm' }, ['Angry']],
                             probabilities: { 0 => 0.6, 1 => 0.4 }, confidence: 0.2)
    expect(score.levels.first[:description]).to be_frozen
    expect(score.inspect).to include('score: 0.4')
  end
end
