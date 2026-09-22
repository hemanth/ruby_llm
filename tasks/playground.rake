# frozen_string_literal: true

desc 'Start the interactive in-browser RubyLLM playground'
task :playground do
  server_script = File.expand_path('../playground/serve.js', __dir__)
  exec('node', server_script)
end
