import ExpoModulesCore
import UIKit

class LiquidGlassView: ExpoView {
  private var effectView: UIVisualEffectView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupGlassEffect()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupGlassEffect() {
    if #available(iOS 26, *) {
      let glass = UIGlassEffect()
      let visualEffectView = UIVisualEffectView(effect: glass)
      visualEffectView.translatesAutoresizingMaskIntoConstraints = false
      insertSubview(visualEffectView, at: 0)
      NSLayoutConstraint.activate([
        visualEffectView.topAnchor.constraint(equalTo: topAnchor),
        visualEffectView.leadingAnchor.constraint(equalTo: leadingAnchor),
        visualEffectView.trailingAnchor.constraint(equalTo: trailingAnchor),
        visualEffectView.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
      effectView = visualEffectView
    }
    // On iOS < 26: renders as plain view (children still visible, no glass)
  }

  func setCornerRadius(_ radius: CGFloat) {
    layer.cornerRadius = radius
    clipsToBounds = true
    effectView?.layer.cornerRadius = radius
    effectView?.clipsToBounds = true
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effectView?.frame = bounds
  }
}
