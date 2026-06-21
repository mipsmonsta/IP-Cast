require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name     = 'LocalMediaServer'
  s.version  = package['version']
  s.summary  = 'Local HTTP media server for IP Cast'
  s.license  = 'MIT'
  s.authors  = { package['name'] => '' }
  s.homepage = package['homepage']
  s.platform = :ios, '15.1'

  s.source = { git: '' }
  s.source_files = '*.{h,m}'

  s.dependency 'GCDWebServer', '~> 3.0'
  s.dependency 'React'
end
