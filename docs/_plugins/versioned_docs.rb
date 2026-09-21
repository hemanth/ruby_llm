# frozen_string_literal: true

Jekyll::Hooks.register :site, :post_read, priority: :high do |site|
  origin = site.config.fetch('url').delete_suffix('/')
  base = site.config.fetch('baseurl', '').delete_suffix('/')
  site.config['docs_unreleased'] = ['next', 'Next (unreleased)'].include?(site.data.dig('versions', 'current'))
  pages = site.pages + site.collections.values.flat_map(&:docs)
  pages.each do |page|
    canonical = page.data['canonical_url']
    page.data['canonical_url'] = canonical.delete_prefix(origin) if canonical&.start_with?("#{origin}/")
  end

  llms = site.config.dig('jekyll_vitepress', 'llms')
  next unless llms

  label = site.data.dig('versions', 'current')
  label = 'Next (unreleased)' if label == 'next'
  llms['description'] = "Developer documentation for RubyLLM #{label}." if label
  llms['details'] = llms['details'].to_s.gsub("#{origin}/api/", "#{origin}#{base}/api/")
end
