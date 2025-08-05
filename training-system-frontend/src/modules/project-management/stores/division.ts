import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getProjectParticipants } from '@/api/modules/user';
import { getProject } from '@/api/modules/project';

// 类型定义
export interface ProjectRole {
  id: string;
  name: string;
  assignee: string | null;
  description?: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DivisionTask {
  id: string;
  name: string; // 任务名称
  description?: string;
  assignedRoleId?: string; // 分配给的角色ID
  checklist: Array<{ text: string; completed: boolean }>; // 任务清单数组
  expanded?: boolean; // 是否展开显示详情
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  userId: string; // 项目参与者的用户ID
  name: string;
  department?: string;
  position?: string;
  user?: any; // 完整的用户对象
}

// localStorage 键名
const getStorageKey = (projectId: string, type: 'roles' | 'tasks') => `division_${type}_${projectId}`;

export const useDivisionStore = defineStore('division', () => {
  // 状态
  const roles = ref<ProjectRole[]>([]);
  const tasks = ref<DivisionTask[]>([]);
  const members = ref<ProjectMember[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 从localStorage加载数据
  const loadFromStorage = (projectId: string) => {
    try {
      const savedRoles = localStorage.getItem(getStorageKey(projectId, 'roles'));
      const savedTasks = localStorage.getItem(getStorageKey(projectId, 'tasks'));
      
      if (savedRoles) {
        roles.value = JSON.parse(savedRoles);
        console.log('✅ 从localStorage加载角色数据:', roles.value.length);
      }
      
      if (savedTasks) {
        tasks.value = JSON.parse(savedTasks);
        console.log('✅ 从localStorage加载任务数据:', tasks.value.length);
      }
    } catch (err) {
      console.error('❌ 从localStorage加载数据失败:', err);
    }
  };

  // 保存到localStorage
  const saveToStorage = (projectId: string) => {
    try {
      localStorage.setItem(getStorageKey(projectId, 'roles'), JSON.stringify(roles.value));
      localStorage.setItem(getStorageKey(projectId, 'tasks'), JSON.stringify(tasks.value));
      console.log('✅ 数据已保存到localStorage');
    } catch (err) {
      console.error('❌ 保存数据到localStorage失败:', err);
    }
  };

  // 加载项目角色
  const loadRoles = async (projectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 加载项目角色:', projectId);
      
      // 🔧 关键修复：从后端获取分工数据
      try {
        const projectData = await getProject(projectId);
        console.log('✅ 获取项目数据完整对象:', projectData);
        console.log('✅ 项目config字段:', projectData?.config);
        
        // 从项目配置中获取分工数据
        const divisionConfig = projectData?.config?.division;
        console.log('✅ 分工配置数据:', divisionConfig);
        console.log('✅ 分工配置类型:', typeof divisionConfig);
        console.log('✅ 分工角色数据:', divisionConfig?.roles);
        console.log('✅ 分工角色数据类型:', typeof divisionConfig?.roles, '是否数组:', Array.isArray(divisionConfig?.roles));
        
        if (divisionConfig && divisionConfig.roles && Array.isArray(divisionConfig.roles)) {
          roles.value = divisionConfig.roles.map((role: any) => ({
            ...role,
            projectId,
            createdAt: role.createdAt || new Date().toISOString(),
            updatedAt: role.updatedAt || new Date().toISOString(),
          }));
          console.log('✅ 从后端加载角色数据成功:', roles.value.length);
          console.log('✅ 角色详情:', roles.value.map(r => ({ id: r.id, name: r.name, assignee: r.assignee })));
        } else {
          console.log('⚠️ 后端没有角色数据，原因分析:');
          console.log('  - divisionConfig存在:', !!divisionConfig);
          console.log('  - divisionConfig.roles存在:', !!divisionConfig?.roles);
          console.log('  - divisionConfig.roles是数组:', Array.isArray(divisionConfig?.roles));
          throw new Error('后端没有角色数据');
        }
      } catch (backendError) {
        console.warn('⚠️ 从后端加载失败，回退到localStorage:', backendError);
        
        // 回退到localStorage
        loadFromStorage(projectId);
        
        // 如果localStorage也没有数据，则初始化默认角色
        if (roles.value.length === 0) {
          roles.value = [
            {
              id: '1',
              name: '会务负责人',
              assignee: null,
              description: '负责会议场地、设备、接待等事务',
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: '讲师联络人',
              assignee: null,
              description: '负责与讲师沟通协调',
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '3',
              name: '物料管理员',
              assignee: null,
              description: '负责培训物料采购和管理',
              projectId,
              createdAt: new Date().toISOString(),
            },
          ];
          console.log('✅ 使用默认角色数据');
        }
      }
      
      console.log('✅ 角色加载完成:', roles.value.length);
    } catch (err: any) {
      console.error('❌ 加载角色失败:', err);
      error.value = err.message;
      ElMessage.error('加载项目角色失败');
    } finally {
      loading.value = false;
    }
  };

  // 加载项目任务
  const loadTasks = async (projectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 加载项目任务:', projectId);
      
      // 🔧 关键修复：从后端获取任务数据
      try {
        const projectData = await getProject(projectId);
        console.log('✅ 获取项目数据完整对象:', projectData);
        console.log('✅ 项目config字段:', projectData?.config);
        
        // 从项目配置中获取分工数据
        const divisionConfig = projectData?.config?.division;
        console.log('✅ 分工配置数据:', divisionConfig);
        console.log('✅ 分工配置类型:', typeof divisionConfig);
        console.log('✅ 分工任务数据:', divisionConfig?.tasks);
        console.log('✅ 分工任务数据类型:', typeof divisionConfig?.tasks, '是否数组:', Array.isArray(divisionConfig?.tasks));
        
        if (divisionConfig && divisionConfig.tasks && Array.isArray(divisionConfig.tasks)) {
          tasks.value = divisionConfig.tasks.map((task: any) => ({
            ...task,
            projectId,
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || new Date().toISOString(),
          }));
          console.log('✅ 从后端加载任务数据成功:', tasks.value.length);
          console.log('✅ 任务详情:', tasks.value.map(t => ({ id: t.id, name: t.name, assignedUserId: t.assignedUserId })));
        } else {
          console.log('⚠️ 后端没有任务数据，原因分析:');
          console.log('  - divisionConfig存在:', !!divisionConfig);
          console.log('  - divisionConfig.tasks存在:', !!divisionConfig?.tasks);
          console.log('  - divisionConfig.tasks是数组:', Array.isArray(divisionConfig?.tasks));
          throw new Error('后端没有任务数据');
        }
      } catch (backendError) {
        console.warn('⚠️ 从后端加载任务失败，回退到localStorage:', backendError);
        
        // 回退到localStorage
        loadFromStorage(projectId);
        
        // 如果localStorage中没有任务数据，则初始化默认任务
        if (tasks.value.length === 0) {
          tasks.value = [
            {
              id: '101',
              name: '布置A栋主会场',
              description: '准备主会场的音响、投影等设备',
              assignedUserId: undefined,
              checklist: [
                { text: '确认场地', completed: false },
                { text: '调试音响', completed: false },
                { text: '测试投影', completed: false },
                { text: '准备座椅', completed: false },
              ],
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '102',
              name: '确认讲师行程与住宿',
              description: '与讲师确认到达时间和住宿安排',
              assignedUserId: undefined,
              checklist: [
                { text: '确认行程', completed: false },
                { text: '预订住宿', completed: false },
              ],
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '103',
              name: '采购学员手册和文具',
              description: '采购培训所需的学员手册和文具用品',
              assignedUserId: undefined,
              checklist: [
                { text: '设计手册', completed: false },
                { text: '印刷手册', completed: false },
                { text: '采购笔', completed: false },
                { text: '采购本子', completed: false },
                { text: '分发物料', completed: false },
              ],
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '104',
              name: '准备签到二维码',
              description: '生成和测试签到二维码系统',
              assignedUserId: undefined,
              checklist: [
                { text: '生成二维码', completed: false },
                { text: '测试扫码', completed: false },
              ],
              projectId,
              createdAt: new Date().toISOString(),
            },
            {
              id: '105',
              name: '与讲师最终确认课件',
              description: '确认讲师课件内容和技术要求',
              assignedUserId: undefined,
              checklist: [
                { text: '确认课件', completed: false },
              ],
              projectId,
              createdAt: new Date().toISOString(),
            },
          ];
          console.log('✅ 使用默认任务数据');
        }
      }
      
      console.log('✅ 任务加载完成:', tasks.value.length);
    } catch (err: any) {
      console.error('❌ 加载任务失败:', err);
      error.value = err.message;
      ElMessage.error('加载项目任务失败');
    } finally {
      loading.value = false;
    }
  };

  // 加载项目成员
  const loadMembers = async (projectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 加载项目成员:', projectId);
      
      // 调用真实API获取项目参与者
      const participants = await getProjectParticipants(projectId);
      console.log('✅ API返回的参与者数据:', participants);
      
      // 检查返回数据格式
      if (!participants || !Array.isArray(participants)) {
        console.warn('⚠️ API返回数据格式异常:', participants);
        throw new Error('API返回数据格式异常');
      }
      
      // 将参与者数据转换为成员格式，确保数据结构正确
      members.value = participants.map(participant => {
        const user = participant.user;
        return {
          userId: participant.userId,
          id: user?.id || participant.userId,
          name: user?.name || user?.username || `用户${participant.userId}`,
          department: user?.department || '未知部门',
          position: user?.position || user?.level || '未知职位',
          user: user, // 保留完整的用户对象供其他地方使用
        };
      });
      
      console.log('✅ 成员加载完成:', members.value.length);
      console.log('✅ 成员数据:', members.value.map(m => ({ userId: m.userId, name: m.name })));
      
      // 如果没有成员，提供默认的admin用户供测试
      if (members.value.length === 0) {
        console.log('⚠️ 没有项目成员，添加默认管理员用户');
        members.value = [
          {
            userId: 'admin',
            id: 'admin',
            name: '管理员',
            department: '系统管理',
            position: '管理员',
            user: {
              id: 'admin',
              name: '管理员',
              username: 'admin',
              department: '系统管理',
              position: '管理员'
            }
          }
        ];
      }
      
    } catch (err: any) {
      console.error('❌ 加载成员失败:', err);
      error.value = err.message;
      
      // 如果API调用失败，提供默认用户供测试使用
      console.log('🔄 API失败，使用默认用户数据');
      members.value = [
        {
          userId: 'admin',
          id: 'admin', 
          name: '管理员',
          department: '系统管理',
          position: '管理员',
          user: {
            id: 'admin',
            name: '管理员',
            username: 'admin',
            department: '系统管理',
            position: '管理员'
          }
        }
      ];
      
      ElMessage.warning('加载项目成员失败，使用默认用户数据');
    } finally {
      loading.value = false;
    }
  };

  // 添加角色
  const addRole = async (roleData: Omit<ProjectRole, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔄 添加角色:', roleData);
      
      const newRole: ProjectRole = {
        ...roleData,
        id: `role-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      roles.value.push(newRole);
      saveToStorage(roleData.projectId);
      ElMessage.success('角色添加成功');
      return newRole;
    } catch (err: any) {
      console.error('❌ 添加角色失败:', err);
      ElMessage.error('添加角色失败');
      throw err;
    }
  };

  // 更新角色分配
  const updateRoleAssignment = async (roleId: string, assigneeId: string | null) => {
    try {
      console.log('🔄 更新角色分配:', roleId, assigneeId);
      
      const role = roles.value.find(r => r.id === roleId);
      if (role) {
        role.assignee = assigneeId;
        role.updatedAt = new Date().toISOString();
        saveToStorage(role.projectId);
        ElMessage.success('角色分配更新成功');
      }
    } catch (err: any) {
      console.error('❌ 更新角色分配失败:', err);
      ElMessage.error('更新角色分配失败');
      throw err;
    }
  };

  // 添加任务
  const addTask = async (taskData: Omit<DivisionTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔄 添加任务:', taskData);
      
      const newTask: DivisionTask = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      tasks.value.push(newTask);
      saveToStorage(taskData.projectId);
      ElMessage.success('任务添加成功');
      return newTask;
    } catch (err: any) {
      console.error('❌ 添加任务失败:', err);
      ElMessage.error('添加任务失败');
      throw err;
    }
  };

  // 更新任务
  const updateTask = async (taskId: string, taskData: Partial<DivisionTask>) => {
    try {
      console.log('🔄 更新任务:', taskId, taskData);
      
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = {
          ...tasks.value[taskIndex],
          ...taskData,
          updatedAt: new Date().toISOString(),
        };
        saveToStorage(tasks.value[taskIndex].projectId);
        ElMessage.success('任务更新成功');
      }
    } catch (err: any) {
      console.error('❌ 更新任务失败:', err);
      ElMessage.error('更新任务失败');
      throw err;
    }
  };

  // 删除任务
  const deleteTask = async (taskId: string) => {
    try {
      console.log('🔄 删除任务:', taskId);
      
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const projectId = tasks.value[taskIndex].projectId;
        tasks.value.splice(taskIndex, 1);
        saveToStorage(projectId);
        ElMessage.success('任务删除成功');
      }
    } catch (err: any) {
      console.error('❌ 删除任务失败:', err);
      error.value = err.message;
      ElMessage.error('删除任务失败');
      throw err;
    }
  };

  // 更新角色名称
  const updateRoleName = async (roleId: string, newName: string) => {
    try {
      console.log('🔄 更新角色名称:', roleId, newName);
      
      const role = roles.value.find(r => r.id === roleId);
      if (role) {
        role.name = newName;
        role.updatedAt = new Date().toISOString();
        saveToStorage(role.projectId);
        ElMessage.success('角色名称更新成功');
      }
    } catch (err: any) {
      console.error('❌ 更新角色名称失败:', err);
      ElMessage.error('更新角色名称失败');
      throw err;
    }
  };

  // 删除角色
  const deleteRole = async (roleId: string) => {
    try {
      console.log('🔄 删除角色:', roleId);
      
      const roleIndex = roles.value.findIndex(r => r.id === roleId);
      if (roleIndex !== -1) {
        const projectId = roles.value[roleIndex].projectId;
        
        // 取消所有使用此角色的任务分配
        tasks.value.forEach(task => {
          if (task.assignedUserId === roleId) {
            task.assignedUserId = undefined;
          }
        });
        
        roles.value.splice(roleIndex, 1);
        saveToStorage(projectId);
        ElMessage.success('角色删除成功');
      }
    } catch (err: any) {
      console.error('❌ 删除角色失败:', err);
      ElMessage.error('删除角色失败');
      throw err;
    }
  };

  // 初始化项目分工数据
  const initProject = async (projectId: string) => {
    console.log('🔄 初始化项目分工数据:', projectId);
    await Promise.all([
      loadRoles(projectId),
      loadTasks(projectId),
      loadMembers(projectId),
    ]);
  };

  // 计算属性辅助函数
  const getRoleName = (roleId: string): string => {
    const role = roles.value.find(r => r.id === roleId);
    return role?.name || '未分配';
  };

  const getAssigneeName = (roleId: string): string => {
    const role = roles.value.find(r => r.id === roleId);
    if (!role || !role.assignee) return '未指派';
    const member = members.value.find(m => m.id === role.assignee);
    return member?.name || '未知人员';
  };

  return {
    // 状态
    roles,
    tasks,
    members,
    loading,
    error,
    
    // 动作
    loadRoles,
    loadTasks,
    loadMembers,
    addRole,
    updateRoleAssignment,
    addTask,
    updateTask,
    deleteTask,
    updateRoleName,
    deleteRole,
    initProject,
    
    // 辅助函数
    getRoleName,
    getAssigneeName,
  };
}); 