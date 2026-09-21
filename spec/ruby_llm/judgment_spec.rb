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
