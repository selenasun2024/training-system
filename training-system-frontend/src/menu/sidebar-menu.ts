import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from './types'
import { topNavMenu } from './top-nav-menu'

/**
 * A dynamic composable that provides the sidebar menu based on the current route.
 * It finds the active top-level menu item and returns its children as the sidebar menu.
 * This ensures the sidebar is always in sync with the top navigation.
 *
 * @returns A computed ref containing the array of sidebar menu items.
 */
export function useSidebarMenu() {
  const route = useRoute()

  const sidebarMenu = computed<MenuItem[]>(() => {
    // Get the current top-level module path, e.g., 'project-management'
    const currentModulePath = route.path.split('/')[2]
    if (!currentModulePath) return []

    // Find the corresponding menu item from the top navigation configuration
    const activeTopNav = topNavMenu.find(
      (item) => item.key === currentModulePath
    )

    // Return its children, or an empty array if it has no children
    return activeTopNav?.children || []
  })

  return {
    sidebarMenu,
  }
} 