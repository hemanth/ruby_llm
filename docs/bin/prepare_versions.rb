#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'

path, current, base = ARGV
versions = YAML.load_file(path)
versions['current'] = versions.fetch('items').find { |item| item['id'] == current }.fetch('title')
versions['items'].each do |item|
  item['url'] = "#{base}#{item.fetch('url')}" unless item['external']
end
File.write(path, YAML.dump(versions))
