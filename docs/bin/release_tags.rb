#!/usr/bin/env ruby
# frozen_string_literal: true

require 'open3'
require 'rubygems/version'

tags, status = Open3.capture2e('git', 'tag', '--list', chdir: ARGV.fetch(0))
abort tags unless status.success?

releases = tags.lines.map(&:strip).filter_map do |tag|
  next unless tag.match?(/\Av?\d+\.\d+\.\d+\z/)

  [Gem::Version.new(tag.delete_prefix('v')), tag]
end.sort_by(&:first)

stable = releases.last
legacy = releases.reverse.find { |version, _tag| version.segments.first == 1 }
abort 'Documentation requires stable release tags and a 1.x release tag' unless stable && legacy

puts "#{stable.last} #{legacy.last}"
