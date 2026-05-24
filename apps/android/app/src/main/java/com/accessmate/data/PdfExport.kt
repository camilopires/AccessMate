package com.accessmate.data

import android.content.Context
import android.content.Intent
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

/** Renders an incident's draft body into a single-page A4 PDF and
 *  returns a shareable Intent (ACTION_SEND) the caller can launch. */
object PdfExport {

    fun makeAndShareIntent(ctx: Context, inc: Incident): Intent {
        val doc = PdfDocument()
        // A4 at 72dpi — keep close enough for printing without fussing
        // with PrintAttributes; emailable.
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = doc.startPage(pageInfo)
        val canvas = page.canvas

        val title = Paint().apply {
            textSize = 22f
            isAntiAlias = true
            isFakeBoldText = true
        }
        val small = Paint().apply { textSize = 10f; isAntiAlias = true; color = 0xFF6F6A60.toInt() }
        val body = Paint().apply { textSize = 11f; isAntiAlias = true }

        canvas.drawText("AccessMate report", 48f, 60f, small)
        canvas.drawText(inc.title ?: "Untitled incident", 48f, 90f, title)
        canvas.drawText(inc.startedAtISO.take(10), 48f, 108f, small)

        // Multi-line body wrap. Naive line break at ~95 chars; the
        // assembled draft already contains hard newlines so we honour
        // those + soft-wrap anything longer.
        val maxWidth = 595f - 96f
        val raw = inc.draftBody.orEmpty()
        val lines = mutableListOf<String>()
        for (rawLine in raw.lines()) {
            if (body.measureText(rawLine) <= maxWidth) {
                lines.add(rawLine)
                continue
            }
            var remaining = rawLine
            while (remaining.isNotEmpty()) {
                var cut = remaining.length
                while (cut > 0 && body.measureText(remaining.substring(0, cut)) > maxWidth) cut--
                lines.add(remaining.substring(0, cut))
                remaining = remaining.substring(cut).trimStart()
            }
        }
        var y = 140f
        for (line in lines) {
            if (y > 800f) break
            canvas.drawText(line, 48f, y, body)
            y += 14f
        }

        doc.finishPage(page)

        val out = File(ctx.cacheDir, "AccessMate-${inc.id}.pdf")
        FileOutputStream(out).use { doc.writeTo(it) }
        doc.close()

        val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.fileprovider", out)
        return Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }
}
