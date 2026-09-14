# frozen_string_literal: true

require 'spec_helper'
require 'nokogiri'
require 'open3'
require 'tmpdir'
require 'yaml'

RSpec.describe 'Versioned documentation site', type: :task do
  let(:root) { File.expand_path('../..', __dir__) }
  let(:site) { Dir.mktmpdir('rubyllm-docs-spec') }

  after do
    FileUtils.remove_entry(site)
  end

  def write_page(relative, content = 'page')
    path = File.join(site, relative)
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content)
    path
  end

  def run_script(name, *args)
    output, status = Open3.capture2e(RbConfig.ruby, File.join(root, 'docs/bin', name), *args)
    expect(status.success?).to be(true), output
  end

  def html(relative)
    Nokogiri::HTML(File.read(File.join(site, relative)))
  end

  describe 'redirects' do
    before do
      write_page('index.html', 'current home')
      write_page('chat/index.html', 'current chat')
      write_page('chat.md', 'current chat markdown')
      write_page('api/RubyLLM/Chat.html', 'API')
      write_page('api/RubyLLM/Chat.md', 'API markdown')
      write_page('v1/index.html', 'stable home')
      write_page('v1/chat/index.html', 'stable chat')
      write_page('v1/chat.md', 'stable chat markdown')
      write_page('v1/rails/index.html', 'stable Rails')
      write_page('404.html', 'not found')
      write_page('v1/404.html', 'old not found')
      write_page('llms.txt', 'current index')
      write_page('robots.txt', "User-agent: *\nSitemap: https://rubyllm.com/sitemap.xml\n")
    end

    it 'redirects old 2.0 guide and API URLs to their new canonical locations' do
      run_script('build_version_redirects.rb', site)

      expect(html('next/index.html').at_css('link[rel=canonical]')['href']).to eq('https://rubyllm.com/')
      expect(html('next/chat/index.html').at_css('a')['href']).to eq('/chat/')
      expect(html('next/api/RubyLLM/Chat.html').at_css('a')['href']).to eq('/api/RubyLLM/Chat.html')
      expect(html('next/chat/index.html').at_css('meta[name=robots]')['content']).to eq('noindex,follow')
      expect(html('next/chat/index.html').at_css('script').text).to include('window.location.search',
                                                                            'window.location.hash')
      expect(html('next/chat/index.html').at_css('meta[http-equiv=refresh]')['content']).to eq('0;url=/chat/')
    end

    it 'preserves old-only routes without replacing current pages or error pages' do
      run_script('build_version_redirects.rb', site)

      expect(html('rails/index.html').at_css('a')['href']).to eq('/v1/rails/')
      expect(File.read(File.join(site, 'chat/index.html'))).to eq('current chat')
      expect(File.read(File.join(site, 'v1/chat/index.html'))).to eq('stable chat')
      expect(File.read(File.join(site, '404.html'))).to eq('not found')
      expect(File).not_to exist(File.join(site, 'next/v1'))
    end

    it 'keeps old machine-readable URLs usable and exposes the stable sitemap' do
      run_script('build_version_redirects.rb', site)

      expect(File.read(File.join(site, 'next/llms.txt'))).to eq('current index')
      expect(File.read(File.join(site, 'next/chat.md'))).to eq('current chat markdown')
      expect(File.read(File.join(site, 'next/api/RubyLLM/Chat.md'))).to eq('API markdown')
      expect(File).not_to exist(File.join(site, 'next/v1'))
      expect(File.read(File.join(site, 'robots.txt'))).to include('https://rubyllm.com/v1/sitemap.xml')
    end

    it 'supports a Pages base path for both versions and their section redirects' do
      run_script('build_version_redirects.rb', site, '/ruby_llm')

      expect(html('next/chat/index.html').at_css('a')['href']).to eq('/ruby_llm/chat/')
      expect(html('rails/index.html').at_css('link[rel=canonical]')['href']).to eq('https://rubyllm.com/ruby_llm/v1/rails/')
    end
  end

  describe 'version selector' do
    it 'labels the root version as prerelease and the 1.x version as stable' do
      versions = YAML.load_file(File.join(root, 'docs/_data/versions.yml'))

      expect(versions['current']).to include('prerelease')
      expect(versions['items']).to include(include('url' => '/', 'title' => include('prerelease')))
      expect(versions['items']).to include(include('url' => '/v1/', 'title' => include('stable')))
    end

    it 'uses site-wide URLs when rendering inside the stable version or a Pages base path' do
      path = write_page('versions.yml', File.read(File.join(root, 'docs/_data/versions.yml')))
      run_script('prepare_versions.rb', path, 'v1.16.0', '/ruby_llm')
      versions = YAML.load_file(path)

      expect(versions['current']).to eq('1.16.0 (stable)')
      expect(versions['items'].pluck('url')).to eq([
                                                     '/ruby_llm/', '/ruby_llm/v1/',
                                                     'https://github.com/crmne/ruby_llm/releases'
                                                   ])
    end
  end
end
