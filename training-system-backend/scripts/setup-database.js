const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'mwclg20241021',
  multipleStatements: true // 允许执行多条SQL语句
};

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 分批执行SQL脚本
async function executeSqlScript(connection, sqlScript) {
  // 改进的SQL语句分割，正确处理多行语句
  const statements = [];
  let currentStatement = '';
  const lines = sqlScript.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行和注释行
    if (!trimmedLine || trimmedLine.startsWith('--')) {
      continue;
    }
    
    // 累积当前语句
    if (currentStatement) {
      currentStatement += ' ' + trimmedLine;
    } else {
      currentStatement = trimmedLine;
    }
    
    // 如果行以分号结尾，表示语句结束
    if (trimmedLine.endsWith(';')) {
      // 移除末尾的分号
      currentStatement = currentStatement.slice(0, -1).trim();
      if (currentStatement) {
        statements.push(currentStatement);
      }
      currentStatement = '';
    }
  }
  
  // 处理最后一个语句（如果没有分号结尾）
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  let successCount = 0;
  let skipCount = 0;
  
  log(`📊 解析到 ${statements.length} 条SQL语句`, 'blue');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // 跳过特定语句
    if (statement.toUpperCase().startsWith('USE ') ||
        statement.toUpperCase().startsWith('CREATE DATABASE')) {
      log(`  ⚠ 跳过: ${statement.substring(0, 50)}...`, 'yellow');
      skipCount++;
      continue;
    }
    
    try {
      await connection.execute(statement);
      successCount++;
      
      // 显示详细进度
      if (statement.toUpperCase().startsWith('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1];
        log(`  ✓ 创建表: ${tableName}`, 'green');
      } else if (statement.toUpperCase().startsWith('INSERT INTO')) {
        const tableName = statement.match(/INSERT INTO\s+(\w+)/i)?.[1];
        log(`  ✓ 插入数据: ${tableName}`, 'green');
      } else if (statement.toUpperCase().startsWith('ALTER TABLE')) {
        log(`  ✓ 修改表结构`, 'green');
      } else {
        log(`  ✓ 执行成功 (${successCount})`, 'green');
      }
    } catch (error) {
      // 某些语句可能会失败（比如表已存在），这是正常的
      if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
          error.code === 'ER_DB_CREATE_EXISTS' ||
          error.code === 'ER_DUP_KEYNAME') {
        log(`  ⚠ 跳过 (${error.code}): ${statement.substring(0, 50)}...`, 'yellow');
        skipCount++;
      } else {
        log(`  ❌ 执行失败: ${statement.substring(0, 50)}...`, 'red');
        log(`     错误代码: ${error.code}`, 'red');
        log(`     错误信息: ${error.message}`, 'red');
        throw error; // 重新抛出严重错误
      }
    }
  }
  
  log(`📊 SQL执行统计: 成功 ${successCount} 条, 跳过 ${skipCount} 条`, 'blue');
}

async function setupDatabase() {
  let connection;
  
  try {
    log('🚀 开始设置培训系统数据库...', 'blue');
    
    // 1. 连接MySQL（不指定数据库）
    log('📡 连接到MySQL服务器...', 'yellow');
    connection = await mysql.createConnection(dbConfig);
    log('✅ MySQL连接成功', 'green');
    
    // 2. 创建数据库
    log('🗃️ 创建training_system数据库...', 'yellow');
    await connection.execute('CREATE DATABASE IF NOT EXISTS training_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    log('✅ 数据库创建成功', 'green');
    
    // 3. 关闭当前连接
    await connection.end();
    
    // 4. 重新连接到training_system数据库
    log('🔌 重新连接到training_system数据库...', 'yellow');
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'training_system'
    });
    log('✅ 数据库连接成功', 'green');
    
    // 5. 读取SQL脚本
    log('📄 读取数据库初始化脚本...', 'yellow');
    const sqlPath = path.join(__dirname, 'init-database-fixed.sql');
    const sqlScript = await fs.readFile(sqlPath, 'utf8');
    log('✅ SQL脚本读取成功', 'green');
    
    // 6. 执行SQL脚本（分批执行，跳过USE语句）
    log('🔧 执行数据库初始化脚本...', 'yellow');
    await executeSqlScript(connection, sqlScript);
    log('✅ 数据库初始化完成', 'green');
    
    // 4. 验证表创建
    log('🔍 验证数据库表创建...', 'yellow');
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as tableName,
        TABLE_COMMENT as tableComment,
        TABLE_ROWS as tableRows
      FROM 
        INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = 'training_system' 
      ORDER BY 
        TABLE_NAME
    `);
    
    log('\n📊 创建的数据库表：', 'blue');
    console.table(tables);
    
    // 5. 验证初始数据
    log('🔍 验证初始数据...', 'yellow');
    const [users] = await connection.execute('SELECT username, name, department FROM training_system.users');
    const [templates] = await connection.execute('SELECT name, type FROM training_system.stage_templates');
    const [taskTemplates] = await connection.execute('SELECT name, type FROM training_system.task_templates');
    
    log('\n👥 初始用户：', 'blue');
    console.table(users);
    
    log('\n📋 阶段模板：', 'blue');
    console.table(templates);
    
    log('\n📝 任务模板：', 'blue');
    console.table(taskTemplates);
    
    // 6. 输出连接信息
    log('\n🎉 数据库设置完成！', 'green');
    log('\n📞 数据库连接信息：', 'blue');
    console.log({
      host: 'localhost',
      port: 3306,
      database: 'training_system',
      username: 'root',
      password: 'mwclg20241021'
    });
    
    log('\n🔗 后端环境变量配置：', 'blue');
    console.log(`
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=mwclg20241021
DB_DATABASE=training_system
    `);
    
  } catch (error) {
    log(`❌ 数据库设置失败: ${error.message}`, 'red');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('💡 请检查MySQL用户名和密码是否正确', 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log('💡 请确保MySQL服务正在运行', 'yellow');
    } else if (error.code === 'ENOENT') {
      log('💡 找不到init-database.sql文件，请确保文件存在', 'yellow');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      log('📡 数据库连接已关闭', 'yellow');
    }
  }
}

// 主函数
async function main() {
  try {
    await setupDatabase();
    process.exit(0);
  } catch (error) {
    log(`💥 程序执行失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { setupDatabase }; 