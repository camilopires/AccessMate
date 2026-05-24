package com.accessmate.data

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.accessmate.MainActivity
import java.util.concurrent.TimeUnit

/** Schedules an 8-week follow-up reminder after an incident is sent.
 *  ORR's complaint-handling guidance gives operators 20 working days to
 *  respond; after 8 weeks a passenger can escalate to the Rail
 *  Ombudsman. The reminder nudges the user at that point. */
object Reminders {

    private const val CHANNEL_ID = "accessmate.escalate"
    private val ESCALATE_WINDOW_DAYS = 8L * 7L

    fun schedule(ctx: Context, incidentId: String, title: String) {
        ensureChannel(ctx)
        val request = OneTimeWorkRequestBuilder<EscalateWorker>()
            .setInitialDelay(ESCALATE_WINDOW_DAYS, TimeUnit.DAYS)
            .setInputData(workDataOf("incidentId" to incidentId, "title" to title))
            .addTag("escalate-$incidentId")
            .build()
        WorkManager.getInstance(ctx).enqueue(request)
    }

    fun cancel(ctx: Context, incidentId: String) {
        WorkManager.getInstance(ctx).cancelAllWorkByTag("escalate-$incidentId")
    }

    private fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Escalate reminders",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "Reminds you when 8 weeks have passed since a sent complaint"
            }
            val mgr = ctx.getSystemService(NotificationManager::class.java)
            mgr.createNotificationChannel(channel)
        }
    }

    class EscalateWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
        override suspend fun doWork(): Result {
            val title = inputData.getString("title") ?: "your incident"
            val incidentId = inputData.getString("incidentId") ?: return Result.success()
            val intent = Intent(applicationContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pi = PendingIntent.getActivity(
                applicationContext,
                0,
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
            val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
                .setContentTitle("Time to escalate?")
                .setContentText("8 weeks have passed since you sent the complaint about \"$title\". You can escalate to the Rail Ombudsman.")
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
            val mgr = applicationContext.getSystemService(NotificationManager::class.java)
            mgr.notify(incidentId.hashCode(), notification)
            return Result.success()
        }
    }
}
