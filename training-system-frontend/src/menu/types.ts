export interface MenuItem {
  /** 菜单项的唯一标识 */
  key: string
  /** 菜单项标题 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标组件 (可选) */
  icon?: any
  /** 是否禁用 (可选) */
  disabled?: boolean
  /** 子菜单项 (可选) */
  children?: MenuItem[]
} 