package com.accessmate.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.accessmate.ui.screens.IncidentDetailScreen
import com.accessmate.ui.screens.IncidentsScreen
import com.accessmate.ui.screens.PassportScreen
import com.accessmate.ui.screens.ProfileEditScreen
import com.accessmate.ui.screens.ReportScreen
import com.accessmate.ui.screens.SettingsScreen

@Composable
fun AccessMateApp() {
    AccessMateTheme {
        val nav = rememberNavController()
        val current by nav.currentBackStackEntryAsState()
        val route = current?.destination?.route

        Scaffold(
            bottomBar = {
                NavigationBar {
                    NavigationBarItem(
                        selected = route?.startsWith("incidents") == true || route == "incident/{id}",
                        onClick = { nav.navigate("incidents") },
                        icon = { Icon(Icons.Outlined.Description, contentDescription = null) },
                        label = { Text("Incidents") },
                    )
                    NavigationBarItem(
                        selected = route?.startsWith("passport") == true || route == "profile/edit",
                        onClick = { nav.navigate("passport") },
                        icon = { Icon(Icons.Outlined.PersonOutline, contentDescription = null) },
                        label = { Text("Passport") },
                    )
                    NavigationBarItem(
                        selected = route == "settings",
                        onClick = { nav.navigate("settings") },
                        icon = { Icon(Icons.Outlined.Settings, contentDescription = null) },
                        label = { Text("Settings") },
                    )
                }
            }
        ) { padding ->
            NavHost(
                navController = nav,
                startDestination = "incidents",
                modifier = Modifier.padding(padding),
            ) {
                composable("incidents") { IncidentsScreen(nav) }
                composable("passport") { PassportScreen(nav) }
                composable("settings") { SettingsScreen() }
                composable("report") { ReportScreen(nav) }
                composable("profile/edit") { ProfileEditScreen(nav) }
                composable(
                    "incident/{id}",
                    arguments = listOf(navArgument("id") { type = NavType.StringType }),
                ) { backStackEntry ->
                    val id = backStackEntry.arguments?.getString("id") ?: ""
                    IncidentDetailScreen(nav, id)
                }
            }
        }
    }
}
