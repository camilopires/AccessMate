require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'GlassSurface'
  s.version        = package['version']
  s.summary        = 'AccessMate adapter for iOS 26 Liquid Glass (UIGlassMaterialView).'
  s.description    = <<~DESC
    Hosts Apple's UIGlassMaterialView on iOS 26+ and falls back to an
    opaque tinted view on older iOS / when Reduce Transparency is on.
    Three tint presets: chrome / card / sheet.
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
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = '*.{h,m,swift}'
end
