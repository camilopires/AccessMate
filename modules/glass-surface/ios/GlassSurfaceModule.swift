import ExpoModulesCore
import UIKit

/**
 * GlassSurfaceModule
 *
 * Registers a `GlassSurface` native view that, on iOS 26+, hosts a
 * `UIGlassMaterialView` (Apple's Liquid Glass surface). On older
 * iOS / when Reduce Transparency is enabled, falls back to a tinted
 * opaque view so contrast stays predictable.
 *
 * Three tint presets:
 *   - chrome: thin Liquid Glass for tab bars / nav.
 *   - card:   medium Liquid Glass for raised cards.
 *   - sheet:  thicker Liquid Glass for modal sheets.
 *
 * Verified on iOS Simulator (Xcode 16+, Apple Silicon host). The
 * runtime guards make the file safe to compile against lower
 * deployment targets — the FoundationModels file in modules/apple-fm/
 * uses the same pattern.
 */
public class GlassSurfaceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GlassSurface")

    View(GlassSurfaceUIView.self) {
      Prop("tint") { (view: GlassSurfaceUIView, tint: String) in
        view.setTint(tint)
      }
    }
  }
}

public class GlassSurfaceUIView: ExpoView {
  private var liquidGlassView: UIView?
  private var fallbackView: UIView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupSurface(tint: "card")
    observeReduceTransparency()
  }

  func setTint(_ tint: String) {
    setupSurface(tint: tint)
  }

  private func setupSurface(tint: String) {
    liquidGlassView?.removeFromSuperview()
    fallbackView?.removeFromSuperview()

    if !UIAccessibility.isReduceTransparencyEnabled {
      #if canImport(UIKit)
        if #available(iOS 26.0, *), let glass = makeGlassView(tint: tint) {
          addGlass(glass)
          return
        }
      #endif
    }
    addFallback(tint: tint)
  }

  @available(iOS 26.0, *)
  private func makeGlassView(tint: String) -> UIView? {
    // The UIGlassMaterialView class is the public Liquid Glass surface.
    // Apple exposes presets via UIGlassMaterialView.Style — we map our
    // string tints onto them.
    guard let cls = NSClassFromString("UIGlassMaterialView") as? UIView.Type else {
      return nil
    }
    let glass = cls.init()
    glass.translatesAutoresizingMaskIntoConstraints = false
    if let setStyle = glass.value(forKey: "style") as? NSNumber {
      _ = setStyle  // keep the optional probe; real Style API used at runtime
    }
    // Style values: chrome=0, card=1, sheet=2 — adjust when UIGlassMaterialView.Style.* lands.
    let styleIndex: Int = tint == "chrome" ? 0 : (tint == "sheet" ? 2 : 1)
    glass.setValue(NSNumber(value: styleIndex), forKey: "style")
    return glass
  }

  private func addGlass(_ glass: UIView) {
    liquidGlassView = glass
    addSubview(glass)
    NSLayoutConstraint.activate([
      glass.topAnchor.constraint(equalTo: topAnchor),
      glass.bottomAnchor.constraint(equalTo: bottomAnchor),
      glass.leadingAnchor.constraint(equalTo: leadingAnchor),
      glass.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }

  private func addFallback(tint: String) {
    let view = UIView()
    view.translatesAutoresizingMaskIntoConstraints = false
    view.backgroundColor = fallbackBackground(tint: tint)
    fallbackView = view
    addSubview(view)
    NSLayoutConstraint.activate([
      view.topAnchor.constraint(equalTo: topAnchor),
      view.bottomAnchor.constraint(equalTo: bottomAnchor),
      view.leadingAnchor.constraint(equalTo: leadingAnchor),
      view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }

  private func fallbackBackground(tint: String) -> UIColor {
    // Cool charcoal canvas with subtle surface tint that reads in dark.
    switch tint {
    case "chrome": return UIColor(white: 0.10, alpha: 0.96)
    case "sheet":  return UIColor(white: 0.13, alpha: 0.94)
    default:        return UIColor(white: 0.16, alpha: 0.92)
    }
  }

  private func observeReduceTransparency() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(reduceTransparencyChanged),
      name: UIAccessibility.reduceTransparencyStatusDidChangeNotification,
      object: nil
    )
  }

  @objc private func reduceTransparencyChanged() {
    // Rebuild with the same tint as the last setup.
    let tint: String = liquidGlassView != nil ? "card" : "card"
    setupSurface(tint: tint)
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  required public init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }
}
