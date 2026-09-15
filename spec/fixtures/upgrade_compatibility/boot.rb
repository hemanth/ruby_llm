# frozen_string_literal: true

ENV.fetch('RUBY_LLM_COMPATIBILITY_GEMS').split(',').each do |dependency|
  name, version = dependency.split(':')
  gem name, version
end
root = ARGV.fetch(0)
Dir.chdir(root)
ENV['RAILS_ENV'] = 'test'
gem 'ruby_llm', '= 1.16.0'
require 'json'
require 'rails'
require 'rails/application'
require 'active_record/railtie'
require 'ruby_llm'
require 'fileutils'
require 'webmock'

WebMock.enable!
WebMock.disable_net_connect!
File.write(File.join(root, 'config/database.yml'), "test:\n  adapter: sqlite3\n  database: ':memory:'\n")
File.write(File.join(root, 'config/initializers/z_ruby_llm_configuration.rb'), <<~RUBY)
  RubyLLM.configure do |config|
    config.use_new_acts_as = true
  end
RUBY
File.write(File.join(root, 'app/models/chat.rb'), <<~RUBY)
  class Chat < ActiveRecord::Base
    acts_as_chat messages: :messages, message_class: 'Message', messages_foreign_key: :chat_id,
                 model: :model, model_class: 'Model', model_foreign_key: :model_id
  end
RUBY
%w[Message ToolCall].each do |name|
  filename = name.gsub(/([a-z])([A-Z])/, '\\1_\\2').downcase
  File.write(File.join(root, "app/models/#{filename}.rb"), "class #{name} < ActiveRecord::Base; end\n")
end
application = Class.new(Rails::Application)
application.config.root = root
application.config.eager_load = false
application.config.enable_reloading = true
application.config.secret_key_base = 'upgrade-initializer-test'
application.config.logger = Logger.new(File::NULL)
application.initialize!
3.times do
  raise 'Upgrade guards missing' unless Chat < RubyLLMUpgrade::Records

  application.reloader.reload!
end
puts JSON.generate(version: RubyLLM::VERSION, reloads: 3)
