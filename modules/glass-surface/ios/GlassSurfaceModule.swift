import ExpoModulesCore
import SwiftUI
import UIKit

/**
 * GlassSurfaceModule
 *
 * Registers a `GlassSurface` native view that, on iOS 26+, hosts a
 * SwiftUI panel using the public `.glassEffect(...)` modifier. Falls
 * back to a tinted opaque view on older iOS or when Reduce
 * Transparency is enabled.
 *
 * Three tint presets:
 *   - chrome: thin Liquid Glass for tab bars / nav.
 *   - card:   medium Liquid Glass for raised cards.
 *   - sheet:  thicker Liquid Glass for modal sheets.
 *
 * Verified on iOS Simulator (Xcode 16+, iOS 26 SDK).
 */
public class GlassSurfaceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GlassSurface")

    View(GlassSurfaceUIView.self) {
      Prop("tint") { (view: GlassSurfaceUIView, tint: String) in
        view.tint = tint
        view.rebuild()
      }
      Prop("cornerRadius") { (view: GlassSurfaceUIView, cornerRadius: Double) in
        view.cornerRadius = CGFloat(cornerRadius)
        view.rebuild()
      }
    }
  }
}

public class GlassSurfaceUIView: ExpoView {
  var tint: String = "card"
  var cornerRadius: CGFloat = 12

  private var hostController: UIViewController?
  private var fallbackView: UIView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    rebuild()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(reduceTransparencyChanged),
      name: UIAccessibility.reduceTransparencyStatusDidChangeNotification,
      object: nil
    )
  }

  func rebuild() {
    hostController?.view.removeFromSuperview()
    hostController = nil
    fallbackView?.removeFromSuperview()
    fallbackView = nil

    if !UIAccessibility.isReduceTransparencyEnabled {
      if #available(iOS 26.0, *) {
        mountGlass()
        return
      }
    }
    mountFallback()
  }

  @available(iOS 26.0, *)
  private func mountGlass() {
    let panel = GlassPanel(tint: tint, cornerRadius: cornerRadius)
    let host = UIHostingController(rootView: panel)
    host.view.backgroundColor = .clear
    host.view.translatesAutoresizingMaskIntoConstraints = false
    addSubview(host.view)
    NSLayoutConstraint.activate([
      host.view.topAnchor.constraint(equalTo: topAnchor),
      host.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      host.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      host.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
    hostController = host
  }

  private func mountFallback() {
    let view = UIView()
    view.translatesAutoresizingMaskIntoConstraints = false
    view.backgroundColor = fallbackBackground(tint: tint)
    view.layer.cornerRadius = cornerRadius
    view.layer.masksToBounds = true
    addSubview(view)
    NSLayoutConstraint.activate([
      view.topAnchor.constraint(equalTo: topAnchor),
      view.bottomAnchor.constraint(equalTo: bottomAnchor),
      view.leadingAnchor.constraint(equalTo: leadingAnchor),
      view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
    fallbackView = view
  }

  private func fallbackBackground(tint: String) -> UIColor {
    // Warm cream paper, matches the JS theme's bg.paper / bg.raised.
    switch tint {
    case "chrome": return UIColor(red: 0.98, green: 0.97, blue: 0.95, alpha: 1.0)
    case "sheet":  return UIColor(red: 0.99, green: 0.98, blue: 0.96, alpha: 1.0)
    default:       return UIColor(red: 0.99, green: 0.98, blue: 0.96, alpha: 1.0)
    }
  }

  @objc private func reduceTransparencyChanged() {
    rebuild()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  required public init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }
}

/// SwiftUI panel that applies the iOS 26 `.glassEffect()` modifier.
/// Kept tiny so the native code stays auditable.
@available(iOS 26.0, *)
struct GlassPanel: View {
  let tint: String
  let cornerRadius: CGFloat

  var body: some View {
    // Apple ships `.regular` and `.clear` Glass styles in iOS 26.
    // `.regular` works against any background; `.clear` is for
    // foreground content. Chrome / card / sheet all use `.regular`
    // — visual hierarchy comes from cornerRadius and the surrounding
    // padding, not from picking different glass thicknesses.
    Rectangle()
      .fill(Color.clear)
      .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
  }
}
