# frozen_string_literal: true

require 'spec_helper'
require 'nokogiri'

RSpec.describe 'Homepage', type: :task do
  let(:source) { File.read(File.expand_path('../../docs/index.md', __dir__)) }
  let(:sections) { Nokogiri::HTML.fragment(source).css('section.home-section') }

  it 'alternates the background of every adjacent section' do
    expect(sections.size).to be > 1

    sections.each_cons(2) do |previous, current|
      message = 'Adjacent sections have the same background: ' \
                "#{previous['class']} and #{current['class']}"
      expect(current.classes.include?('home-band')).not_to eq(previous.classes.include?('home-band')),
                                                           message
    end
  end
end
