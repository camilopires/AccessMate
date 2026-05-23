require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'AppleFm'
  s.version        = package['version']
  s.summary        = 'AccessMate adapter for Apple Foundation Models (on-device LLM).'
  s.description    = <<~DESC
    Bridges Apple Intelligence's on-device language model into the
    AccessMate Expo app for complaint narrative polishing. Guarded by
    @available so it compiles for older deployment targets but only
    activates on iOS 18.1+.
  DESC
  s.homepage       = 'https://github.com/camilopires/AccessMate'
  s.license        = 'UNLICENSED'
  s.author         = { 'AccessMate' => 'noreply@anthropic.com' }
  s.platform       = :ios, '15.1'
  s.swift_version  = '5.9'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.{h,m,swift}'
  s.exclude_files = 'Tests/**/*'

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
  end
end
