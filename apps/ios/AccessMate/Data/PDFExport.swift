import SwiftUI
import UIKit

/// Renders an incident's draft body to a single-page PDF and returns a
/// file URL the caller can hand to a ShareLink. Uses SwiftUI's
/// ImageRenderer on iOS 16+.
enum PDFExport {
    @MainActor
    static func makePDF(for incident: Incident) -> URL? {
        let page = ReportPage(incident: incident)
        let renderer = ImageRenderer(content: page)
        // US Letter at 72 DPI — fits most printers and email clients.
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("AccessMate-\(incident.id).pdf")

        let pdf = CGContext(url as CFURL, mediaBox: nil, nil)
        guard let pdf else { return nil }
        renderer.render { _, render in
            var box = pageRect
            pdf.beginPDFPage([kCGPDFContextMediaBox as String: NSValue(cgRect: pageRect)] as CFDictionary)
            pdf.translateBy(x: 0, y: pageRect.height)
            pdf.scaleBy(x: 1.0, y: -1.0)
            render(pdf)
            pdf.endPDFPage()
            _ = box
        }
        pdf.closePDF()
        return url
    }
}

private struct ReportPage: View {
    let incident: Incident
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AccessMate report")
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.2)
                .foregroundStyle(.secondary)
            Text(incident.title ?? "Untitled incident")
                .font(.system(size: 24, weight: .bold, design: .serif))
            Text(incident.startedAtISO.prefix(10))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            Divider()
            Text(incident.draftBody ?? "")
                .font(.system(size: 11, design: .serif))
                .foregroundStyle(.primary)
        }
        .padding(48)
        .frame(width: 612, height: 792, alignment: .topLeading)
        .background(Color.white)
    }
}
