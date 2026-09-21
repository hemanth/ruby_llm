#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'

path, current, base, stable, legacy = ARGV
versions = YAML.load_file(path)
versions['items'].each do |item|
  item['title'] = "#{stable.delete_prefix('v')} (stable)" if item['id'] == 'stable'
  item['title'] = legacy.delete_prefix('v') if item['id'] == 'v1'
  item['url'] = "#{base}#{item.fetch('url')}" unless item['external']
end
versions['current'] = versions.fetch('items').find { |item| item['id'] == current }.fetch('title')
File.write(path, YAML.dump(versions))
