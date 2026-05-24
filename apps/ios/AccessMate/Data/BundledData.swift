import Foundation

/// Loads the bundled operator + scenario JSON files at app start. The
/// JSON files are copied from `packages/shared/{operators,scenarios}/`
/// into the app bundle's `Resources` directory at scaffold time.
enum BundledData {
    static let operators: [OperatorEntry] = loadAll(folder: "operators")
    static let scenarios: [ScenarioTemplate] = loadAll(folder: "scenarios")

    private static func loadAll<T: Decodable>(folder: String) -> [T] {
        guard let url = Bundle.main.url(forResource: folder, withExtension: nil) else {
            return []
        }
        let fm = FileManager.default
        guard let files = try? fm.contentsOfDirectory(at: url, includingPropertiesForKeys: nil) else {
            return []
        }
        let decoder = JSONDecoder()
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? Data(contentsOf: $0) }
            .compactMap { try? decoder.decode(T.self, from: $0) }
            .sorted { a, b in
                if let oa = a as? OperatorEntry, let ob = b as? OperatorEntry {
                    return oa.name < ob.name
                }
                if let sa = a as? ScenarioTemplate, let sb = b as? ScenarioTemplate {
                    return sa.title < sb.title
                }
                return false
            }
    }
}
