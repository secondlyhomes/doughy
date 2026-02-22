import ExpoModulesCore

public class LiquidGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiquidGlass")

    View(LiquidGlassView.self) {
      Prop("cornerRadius") { (view: LiquidGlassView, value: CGFloat) in
        view.setCornerRadius(value)
      }
    }
  }
}
