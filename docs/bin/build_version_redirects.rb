#!/usr/bin/env ruby
# frozen_string_literal: true

require 'cgi'
require 'fileutils'
require 'json'

site = File.expand_path(ARGV.fetch(0))
base = ARGV.fetch(1, '')

def redirect_page(path, target)
  FileUtils.mkdir_p(File.dirname(path))
  escaped = CGI.escapeHTML(target)
  File.write(path, <<~HTML)
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>RubyLLM documentation has moved</title>
      <link rel="canonical" href="https://rubyllm.com#{escaped}">
      <meta name="robots" content="noindex,follow">
      <script>window.location.replace(#{JSON.generate(target)} + window.location.search + window.location.hash);</script>
      <meta http-equiv="refresh" content="0;url=#{escaped}">
    </head>
    <body><p>This page has moved to <a href="#{escaped}">#{escaped}</a>.</p></body>
    </html>
  HTML
end

Dir.glob('**/*.html', base: site).each do |relative|
  next if relative.start_with?('v1/', 'next/') || relative == '404.html'

  route = relative.delete_suffix('index.html')
  redirect_page(File.join(site, 'next', relative), "#{base}/#{route}")
end

Dir.glob('**/*.html', base: File.join(site, 'v1')).each do |relative|
  next if File.exist?(File.join(site, relative)) || relative == '404.html'

  route = relative.delete_suffix('index.html')
  redirect_page(File.join(site, relative), "#{base}/v1/#{route}")
end

Dir.glob('{llms*.txt,**/*.md}', base: site).each do |relative|
  next if relative.start_with?('v1/', 'next/')

  target = File.join(site, 'next', relative)
  FileUtils.mkdir_p(File.dirname(target))
  FileUtils.cp(File.join(site, relative), target)
end

robots = File.join(site, 'robots.txt')
File.open(robots, 'a') { |file| file.puts "\nSitemap: https://rubyllm.com#{base}/v1/sitemap.xml" }
