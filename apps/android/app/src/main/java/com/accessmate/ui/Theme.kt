package com.accessmate.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.isSystemInDarkTheme

private val PaperLight = lightColorScheme(
    primary = Color(0xFF7A3A0F),
    onPrimary = Color.White,
    secondary = Color(0xFFB85C1F),
    onSecondary = Color.White,
    background = Color(0xFFFAF7F2),
    onBackground = Color(0xFF1B1A17),
    surface = Color(0xFFFDFBF7),
    onSurface = Color(0xFF1B1A17),
    surfaceVariant = Color(0xFFF1EDE5),
    error = Color(0xFFB53728),
)

private val PaperDark = darkColorScheme(
    primary = Color(0xFFE08658),
    onPrimary = Color(0xFF1A0F03),
    secondary = Color(0xFFE08658),
    onSecondary = Color(0xFF1A0F03),
    background = Color(0xFF1A1A17),
    onBackground = Color(0xFFEDE7DC),
    surface = Color(0xFF26241F),
    onSurface = Color(0xFFEDE7DC),
)

@Composable
fun AccessMateTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) PaperDark else PaperLight
    MaterialTheme(colorScheme = colors, content = content)
}
