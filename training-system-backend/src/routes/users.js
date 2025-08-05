const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户基本CRUD路由
router.get('/', userController.getUsers);           // 获取用户列表（分页）
router.get('/search', userController.searchUsers); // 搜索用户（用于选择器）
router.get('/departments', userController.getDepartments); // 获取部门列表
router.get('/levels', userController.getLevels);   // 获取职级列表
router.get('/:id', userController.getUserById);    // 获取用户详情
router.post('/', userController.createUser);       // 创建用户
router.put('/:id', userController.updateUser);     // 更新用户
router.delete('/:id', userController.deleteUser);  // 删除用户（软删除）

module.exports = router; 