const mysql = require('mysql2/promise')

async function inspectDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'mwclg20241021',
    database: 'training_system'
  })

  try {
    console.log('🔍 数据库结构和数据检查报告')
    console.log('='.repeat(50))

    // 检查数据库中的所有表
    console.log('\n📊 数据库表列表:')
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'training_system'
      ORDER BY TABLE_NAME
    `)
    console.log('数据库表:', tables.map(t => t.TABLE_NAME))

    // 检查用户表
    console.log('\n📊 用户表检查:')
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users')
    console.log(`用户总数: ${userCount[0].count}`)
    
    const [users] = await connection.execute('SELECT * FROM users LIMIT 3')
    if (users.length > 0) {
      console.log('用户示例:', JSON.stringify(users[0], null, 2))
    }

    // 检查培训项目表
    if (tables.find(t => t.TABLE_NAME === 'training_projects')) {
      console.log('\n📊 培训项目表检查:')
      const [projectCount] = await connection.execute('SELECT COUNT(*) as count FROM training_projects')
      console.log(`项目总数: ${projectCount[0].count}`)
      
      const [projects] = await connection.execute('SELECT * FROM training_projects LIMIT 3')
      if (projects.length > 0) {
        console.log('项目示例:', JSON.stringify(projects[0], null, 2))
      }
    }

    // 检查项目参与者表
    if (tables.find(t => t.TABLE_NAME === 'project_participants')) {
      console.log('\n📊 项目参与者表检查:')
      const [participantCount] = await connection.execute('SELECT COUNT(*) as count FROM project_participants')
      console.log(`参与者总数: ${participantCount[0].count}`)
      
      const [participants] = await connection.execute(`
        SELECT pp.*, u.name as user_name, tp.name as project_name 
        FROM project_participants pp 
        LEFT JOIN users u ON pp.user_id = u.id 
        LEFT JOIN training_projects tp ON pp.project_id = tp.id 
        LIMIT 3
      `)
      if (participants.length > 0) {
        console.log('参与者示例:', JSON.stringify(participants[0], null, 2))
      }
    }

    // 检查任务表
    if (tables.find(t => t.TABLE_NAME === 'tasks' || t.TABLE_NAME === 'training_tasks')) {
      console.log('\n📊 任务表检查:')
      const taskTable = tables.find(t => t.TABLE_NAME === 'tasks') ? 'tasks' : 'training_tasks'
      const [taskCount] = await connection.execute(`SELECT COUNT(*) as count FROM ${taskTable}`)
      console.log(`任务总数: ${taskCount[0].count}`)
      
      const [tasks] = await connection.execute(`SELECT * FROM ${taskTable} LIMIT 3`)
      if (tasks.length > 0) {
        console.log('任务示例:', JSON.stringify(tasks[0], null, 2))
      }
    }

    // 检查带教相关表
    const mentorshipTables = tables.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('mentor') ||
      t.TABLE_NAME.toLowerCase().includes('teaching') ||
      t.TABLE_NAME.toLowerCase().includes('guide')
    )
    
    if (mentorshipTables.length > 0) {
      console.log('\n📊 带教相关表:', mentorshipTables.map(t => t.TABLE_NAME))
      
      for (const table of mentorshipTables) {
        try {
          const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'training_system' AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
          `, [table.TABLE_NAME])
          
          console.log(`\n表 ${table.TABLE_NAME} 结构:`)
          columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`)
          })

          // 检查表数据
          const [data] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`)
          console.log(`  数据行数: ${data[0].count}`)
          
          if (data[0].count > 0) {
            const [sampleData] = await connection.execute(`SELECT * FROM ${table.TABLE_NAME} LIMIT 2`)
            if (sampleData.length > 0) {
              console.log(`  数据示例:`, JSON.stringify(sampleData[0], null, 2))
            }
          }
        } catch (error) {
          console.error(`检查表 ${table.TABLE_NAME} 失败:`, error.message)
        }
      }
    } else {
      console.log('\n❌ 没有找到带教相关的表')
    }

    // 特别检查吴静的数据
    console.log('\n📊 吴静用户数据检查:')
    const [wujingUser] = await connection.execute('SELECT * FROM users WHERE name = "吴静" OR username LIKE "%market%" LIMIT 1')
    if (wujingUser.length > 0) {
      console.log('吴静用户信息:', JSON.stringify(wujingUser[0], null, 2))
      
      // 检查吴静参与的项目
      if (tables.find(t => t.TABLE_NAME === 'project_participants')) {
        const [wujingProjects] = await connection.execute(`
          SELECT pp.*, tp.name as project_name 
          FROM project_participants pp 
          LEFT JOIN training_projects tp ON pp.project_id = tp.id 
          WHERE pp.user_id = ?
        `, [wujingUser[0].id])
        console.log('吴静参与的项目:', wujingProjects)
      }
    } else {
      console.log('❌ 没有找到吴静的用户数据')
    }

  } catch (error) {
    console.error('❌ 数据库检查失败:', error)
  } finally {
    await connection.end()
  }
}

inspectDatabase() 