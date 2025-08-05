// 清理localStorage并设置正确的管理员信息
console.log('🔄 清理localStorage并设置正确的管理员信息...')

// 清理所有相关的localStorage项
localStorage.removeItem('token')
localStorage.removeItem('userId')
localStorage.removeItem('username')
localStorage.removeItem('userRole')

// 设置正确的管理员信息
localStorage.setItem('token', 'temp-test-token')
localStorage.setItem('userId', 'user-admin-001')
localStorage.setItem('username', 'admin')
localStorage.setItem('userRole', 'admin')

console.log('✅ localStorage清理完成，已设置管理员信息:')
console.log('  - userId:', localStorage.getItem('userId'))
console.log('  - username:', localStorage.getItem('username'))
console.log('  - userRole:', localStorage.getItem('userRole'))
console.log('  - token:', localStorage.getItem('token'))

console.log('🔄 请刷新页面以应用更改') 