import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { nanoid } from 'nanoid';
import { getTaskTypeConfig, getTaskTypesByCategory } from '../constants/taskTypeCategories';
import type { TaskCategory, TaskTypeConfig } from '../constants/taskTypeCategories';
import type { Stage, Task } from '../types/trainingStage';
import { createTask, createTaskSimple, deleteTask, updateTask } from '@/api/modules/task';
import type { CreateTaskRequest } from '@/api/modules/task';
import { ElMessage } from 'element-plus';
import { getProjectTasks } from '@/api/modules/task';
import { updateProjectStage, deleteProjectStage, createProjectStage, getProjectStages, getProject } from '@/api/modules/project';

export const useTrainingStageStore = defineStore('trainingStage', () => {
  // 初始化一个默认阶段
  const initStage: Stage = {
    id: nanoid(),
    name: '阶段一',  // 🔧 修改：使用中文数字
    tasks: [],
    order: 0,
    description: '默认培训阶段',
    status: 'active',
    estimatedDuration: 0,
  };

  const stages = ref<Stage[]>([initStage]);
  // 当前选中阶段id
  const activeStageId = ref<string>(initStage.id);

  // 添加视图模式状态
  const viewMode = ref<'edit' | 'execution'>('edit'); // 'edit' = 编辑模式, 'execution' = 执行模式

  // 计算属性：是否为执行模式
  const isExecutionMode = computed(() => viewMode.value === 'execution');
  
  // 计算属性：是否为编辑模式
  const isEditMode = computed(() => viewMode.value === 'edit');

  // 当前激活阶段
  const activeStage = computed(() => 
    stages.value.find(s => s.id === activeStageId.value)
  );

  // 计算阶段统计信息
  const stageStats = computed(() => {
    return stages.value.map(stage => {
      const totalTasks = stage.tasks.length;
      const completedTasks = stage.tasks.filter(t => t.status === '已完成').length;
      const totalHours = stage.tasks.reduce((sum, task) => {
        const config = getTaskTypeConfig(task.type);
        return sum + (config?.estimatedHours || 0);
      }, 0);
      
      return {
        stageId: stage.id,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalHours,
      };
    });
  });

  // 添加阶段 - 修改为支持后端API调用
  async function addStage(name: string, description?: string, projectId?: string) {
    try {
      let newStageId = nanoid();
      
      // 如果有项目ID并且不是新项目，调用后端API创建阶段
      if (projectId && projectId !== 'new') {
        console.log('➕ 调用后端API创建阶段:', { name, description, projectId });
        const newStageData = await createProjectStage(projectId, {
          name,
          type: 'DURING', // 默认设置为培训中阶段
          description: description || '',
          estimatedDuration: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        newStageId = newStageData.id;
        console.log('✅ 后端阶段创建成功，新阶段ID:', newStageId);
      }

      // 在前端Store中创建新阶段
    const newStage: Stage = {
        id: newStageId,
      name,
      tasks: [],
      order: stages.value.length,
      description: description || '',
        status: 'pending', // 新创建的阶段默认为pending状态，可以被删除
      estimatedDuration: 0,
    };
    stages.value.push(newStage);
    activeStageId.value = newStage.id;
      
      ElMessage.success('新增阶段成功');
    return newStage;
    } catch (error: any) {
      console.error('❌ 创建阶段失败:', error);
      ElMessage.error('创建阶段失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
      return null;
    }
  }

  // 删除阶段 - 修复：确保后端删除成功后才更新前端状态
  async function removeStage(id: string, projectId?: string) {
    const stage = stages.value.find(s => s.id === id);
    if (!stage) {
      console.warn('要删除的阶段不存在:', id);
      return false;
    }

    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('🗑️ 调用后端API删除阶段:', { stageId: id, projectId });
        await deleteProjectStage(id);
        console.log('✅ 后端阶段删除成功');
      }

      // 🔧 修复：只有后端删除成功后，才在前端Store中删除阶段
      const idx = stages.value.findIndex(s => s.id === id);
      if (idx !== -1) {
        stages.value.splice(idx, 1);
        // 如果删除的是当前激活阶段，切换到第一个可用阶段
        if (activeStageId.value === id && stages.value.length > 0) {
          activeStageId.value = stages.value[0].id;
        }
        // 重新计算阶段顺序
        updateStageOrders();
        ElMessage.success('阶段删除成功');
        return true;
      }
    } catch (error: any) {
      console.error('❌ 删除阶段失败:', error);
      console.error('❌ 错误详情:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      });
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          `删除失败 (${error?.response?.status})`;
      ElMessage.error('删除阶段失败：' + errorMessage);
      return false;
    }
    return false;
  }

  // 切换阶段
  function setActiveStage(id: string) {
    const stage = stages.value.find(s => s.id === id);
    if (stage) {
      activeStageId.value = id;
    }
  }

  // 添加任务到指定阶段（修改版本：同时保存到数据库）
  async function addTaskToStage(stageId: string, taskType: string, name: string, config: Record<string, any> = {}, projectId?: string) {
    const stage = stages.value.find(s => s.id === stageId);
    const typeConfig = getTaskTypeConfig(taskType);
    
    if (!stage || !typeConfig) {
      console.error('❌ 无法添加任务：阶段或任务类型配置不存在');
      return null;
    }

    // 创建前端任务对象
    const frontendTask: Task = {
      id: nanoid(),
      type: taskType,
      name,
      description: config.description || '',
      required: config.required ?? true,
      config: {
        ...config,
        estimatedHours: typeConfig.estimatedHours,
        tags: typeConfig.tags,
        color: typeConfig.color,
      },
      status: '未开始',
      order: stage.tasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 先添加到前端store，提供即时反馈
    stage.tasks.push(frontendTask);
    updateStageEstimatedDuration(stageId);

    // 如果提供了项目ID，则保存到后端数据库
    if (projectId && projectId !== 'new') {
      try {
        console.log('📝 准备保存任务到数据库:', {
          projectId,
          stageId,
          taskType,
          name,
          config
        });

                  // 构建后端API请求数据（包含正确的阶段ID）
          const backendTaskData = {
            projectId: projectId,
            stageId: stageId, // 🔧 重要：传递正确的阶段ID，确保任务分配到指定阶段
            name: name,
            description: config.description || '',
            type: taskType,
            required: config.required ?? true,
            orderIndex: stage.tasks.length - 1,
            config: config || {},
            assignedTo: config.assignedTo,
            reviewerRole: config.reviewType === 'counselor' ? 'COUNSELOR' : 
                         config.reviewType === 'teacher' ? 'TEACHER' : 
                         config.reviewType === 'mentor' ? 'COUNSELOR' : undefined,
            dueDate: config.deadline,
            estimatedHours: typeConfig.estimatedHours,
          };

          console.log('📝 即将发送的简化后端请求数据:', JSON.stringify(backendTaskData, null, 2));

          const savedTask = await createTaskSimple(backendTaskData);
        console.log('✅ 任务已保存到数据库:', savedTask);

        // 更新前端任务的ID为后端返回的ID
        if (savedTask && savedTask.data && savedTask.data.id) {
          frontendTask.id = savedTask.data.id;
          console.log('✅ 前端任务ID已更新为后端ID:', frontendTask.id);
        }

        ElMessage.success('任务创建成功并已保存');
      } catch (error: any) {
        console.error('❌ 保存任务到数据库失败:', error);
        console.error('❌ 错误详情:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: error?.config
        });
        ElMessage.error('任务保存失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
        
        // 保存失败时，可以选择是否移除前端任务
        // 这里暂时保留前端任务，让用户知道需要重新保存
      }
    } else {
      console.log('⚠️ 项目ID无效或为新项目，任务仅保存在前端store中');
    }

    return frontendTask;
  }

  // 添加任务到当前阶段
  async function addTaskToActiveStage(taskType: string, name: string, config: Record<string, any> = {}, projectId?: string) {
    if (activeStageId.value) {
      return await addTaskToStage(activeStageId.value, taskType, name, config, projectId);
    }
    return null;
  }

  // 本地更新任务
  function updateTaskLocal(taskId: string, updates: Partial<Task>) {
    for (const stage of stages.value) {
      const task = stage.tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, { ...updates, updatedAt: new Date().toISOString() });
        
        // 如果更新了任务类型，重新计算预计时长
        if (updates.type) {
          const typeConfig = getTaskTypeConfig(updates.type);
          if (typeConfig) {
            task.config = {
              ...task.config,
              estimatedHours: typeConfig.estimatedHours,
              tags: typeConfig.tags,
              color: typeConfig.color,
            };
          }
        }
        
        updateStageEstimatedDuration(stage.id);
        return task;
      }
    }
    return null;
  }

  // 更新任务配置（如标记已推送）
  async function updateTaskConfig(taskId: string, partial: Partial<Task>, projectId?: string) {
    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('✏️ 调用后端API更新任务配置:', { taskId, partial, projectId });
        await updateTask(taskId, partial);
        console.log('✅ 后端任务配置更新成功');
      }

      // 同时更新前端状态
      const localTask = updateTaskLocal(taskId, partial);
      return localTask;
    } catch (error: any) {
      console.error('❌ 更新任务配置失败:', error);
      ElMessage.error('更新任务配置失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
      throw error;
    }
  }

  // 删除任务 - 修复：确保后端删除成功后才更新前端状态
  async function removeTask(taskId: string, projectId?: string) {
    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('🗑️ 调用后端API删除任务:', { taskId, projectId });
        await deleteTask(taskId);
        console.log('✅ 后端任务删除成功');
      }

      // 🔧 修复：只有后端删除成功后，才在前端Store中删除任务
      for (const stage of stages.value) {
        const taskIndex = stage.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          stage.tasks.splice(taskIndex, 1);
          updateStageEstimatedDuration(stage.id);
          updateTaskOrders(stage.id);
          ElMessage.success('任务删除成功');
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('❌ 删除任务失败:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          `删除失败 (${error?.response?.status})`;
      ElMessage.error('删除任务失败：' + errorMessage);
      return false;
    }
  }

  // 移动任务到其他阶段
  function moveTaskToStage(taskId: string, targetStageId: string) {
    let task: Task | null = null;
    let sourceStage: Stage | null = null;
    
    // 找到任务和源阶段
    for (const stage of stages.value) {
      const taskIndex = stage.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        task = stage.tasks[taskIndex];
        sourceStage = stage;
        stage.tasks.splice(taskIndex, 1);
        break;
      }
    }
    
    if (task && sourceStage) {
      const targetStage = stages.value.find(s => s.id === targetStageId);
      if (targetStage) {
        task.order = targetStage.tasks.length;
        targetStage.tasks.push(task);
        
        // 更新两个阶段的预计时长
        updateStageEstimatedDuration(sourceStage.id);
        updateStageEstimatedDuration(targetStageId);
        
        return true;
      }
    }
    return false;
  }

  // 设置阶段名称 - 修改为支持后端API调用
  async function setStageName(id: string, name: string, projectId?: string) {
    const stage = stages.value.find((s) => s.id === id);
    if (!stage) {
      console.warn('要更新的阶段不存在:', id);
      return false;
    }

    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('📝 调用后端API更新阶段名称:', { stageId: id, name, projectId });
        await updateProjectStage(id, { name });
        console.log('✅ 后端阶段名称更新成功');
      }

      // 在前端Store中更新阶段名称
      stage.name = name;
      return true;
    } catch (error: any) {
      console.error('❌ 更新阶段名称失败:', error);
      ElMessage.error('更新阶段名称失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
    return false;
    }
  }

  // 设置阶段描述 - 修改为支持后端API调用
  async function setStageDescription(id: string, description: string, projectId?: string) {
    console.log('🔧 setStageDescription 开始执行:', { id, description, projectId });
    
    const stage = stages.value.find((s) => s.id === id);
    if (!stage) {
      console.warn('要更新的阶段不存在:', id);
      return false;
    }

    console.log('🔧 找到阶段:', stage.name, '原描述:', stage.description);

    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('📝 调用后端API更新阶段描述:', { stageId: id, description, projectId });
        const response = await updateProjectStage(id, { description });
        console.log('✅ 后端API响应:', response);
        console.log('✅ 后端阶段描述更新成功');
      } else {
        console.log('⚠️ 跳过后端API调用（新项目或无项目ID）');
      }

      // 在前端Store中更新阶段描述
      const oldDescription = stage.description;
      stage.description = description;
      console.log('✅ 前端Store描述已更新:', { from: oldDescription, to: description });
      return true;
    } catch (error: any) {
      console.error('❌ 更新阶段描述失败:', error);
      console.error('❌ 错误详情:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      ElMessage.error('更新阶段描述失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
      return false;
    }
  }

  // 更新阶段状态 - 修改为支持后端API调用
  async function updateStageStatus(id: string, status: 'pending' | 'active' | 'completed', projectId?: string) {
    const stage = stages.value.find((s) => s.id === id);
    if (!stage) {
      console.warn('要更新的阶段不存在:', id);
      return false;
    }

    try {
      // 如果有项目ID并且不是新项目，调用后端API
      if (projectId && projectId !== 'new') {
        console.log('📝 调用后端API更新阶段状态:', { stageId: id, status, projectId });
        await updateProjectStage(id, { status });
        console.log('✅ 后端阶段状态更新成功');
      }

      // 在前端Store中更新阶段状态
      stage.status = status;
      return true;
    } catch (error: any) {
      console.error('❌ 更新阶段状态失败:', error);
      ElMessage.error('更新阶段状态失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
      return false;
    }
  }

  // 更新阶段预计时长
  function updateStageEstimatedDuration(stageId: string) {
    const stage = stages.value.find(s => s.id === stageId);
    if (stage) {
      stage.estimatedDuration = stage.tasks.reduce((sum, task) => {
        return sum + (task.config?.estimatedHours || 0);
      }, 0);
    }
  }

  // 更新阶段顺序
  function updateStageOrders() {
    stages.value.forEach((stage, index) => {
      stage.order = index;
    });
  }

  // 更新任务顺序
  function updateTaskOrders(stageId: string) {
    const stage = stages.value.find(s => s.id === stageId);
    if (stage) {
      stage.tasks.forEach((task, index) => {
        task.order = index;
      });
    }
  }

  // 批量添加任务
  async function addTasksBatch(stageId: string, tasks: Array<{ type: string; name: string; config?: Record<string, any> }>) {
    const stage = stages.value.find(s => s.id === stageId);
    if (!stage) return [];
    
    const newTasks: Task[] = [];
    for (const taskData of tasks) {
      const task = await addTaskToStage(stageId, taskData.type, taskData.name, taskData.config || {});
      if (task) {
        newTasks.push(task);
      }
    }
    
    return newTasks;
  }

  // 复制阶段 - 修改为支持后端API调用
  async function duplicateStage(stageId: string, projectId?: string) {
    const stage = stages.value.find(s => s.id === stageId);
    if (!stage) {
      console.warn('要复制的阶段不存在:', stageId);
      return null;
    }

    try {
      let newStageId = nanoid();
      
      // 如果有项目ID并且不是新项目，调用后端API创建阶段
      if (projectId && projectId !== 'new') {
        console.log('🔄 调用后端API复制阶段:', { stageId, projectId });
        const newStageData = await createProjectStage(projectId, {
          name: `${stage.name} (副本)`,
          type: 'DURING', // 默认设置为培训中阶段
          description: stage.description || '',
          estimatedDuration: stage.estimatedDuration,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        newStageId = newStageData.id;
        console.log('✅ 后端阶段复制成功，新阶段ID:', newStageId);
      }

      // 在前端Store中创建新阶段
      const newStage: Stage = {
        ...stage,
        id: newStageId,
        name: `${stage.name} (副本)`,
        order: stages.value.length,
        tasks: [], // 先创建空任务列表
      };
      stages.value.push(newStage);

      // 如果有项目ID并且原阶段有任务，复制任务到后端
      if (projectId && projectId !== 'new' && stage.tasks.length > 0) {
        console.log('🔄 开始复制任务到后端...');
        for (const originalTask of stage.tasks) {
          try {
            const copiedTask = await addTaskToStage(
              newStageId,
              originalTask.type,
              `${originalTask.name} (副本)`,
              {
                ...originalTask.config,
                description: originalTask.description,
                required: originalTask.required,
              },
              projectId
            );
            if (copiedTask) {
              console.log('✅ 任务复制成功:', copiedTask.name);
            }
          } catch (error) {
            console.error('❌ 复制任务失败:', originalTask.name, error);
          }
        }
        console.log('✅ 阶段任务复制完成');
      } else {
        // 如果是新项目或没有后端，仅在前端复制任务
        newStage.tasks = stage.tasks.map(task => ({
          ...task,
          id: nanoid(),
        }));
      }
      
      ElMessage.success(`已复制阶段"${stage.name}"${stage.tasks.length > 0 ? `，包含${stage.tasks.length}个任务` : ''}`);
      return newStage;
    } catch (error: any) {
      console.error('❌ 复制阶段失败:', error);
      ElMessage.error('复制阶段失败：' + (error?.response?.data?.message || error?.message || '未知错误'));
      return null;
    }
  }

  // 获取任务统计信息
  function getTaskStats(stageId?: string) {
    const targetStages = stageId ? [stages.value.find(s => s.id === stageId)].filter(Boolean) : stages.value;
    
    return targetStages.reduce((stats, stage) => {
      if (!stage) return stats;
      
      stage.tasks.forEach(task => {
        const type = task.type;
        if (!stats[type]) {
          stats[type] = { count: 0, completed: 0, total: 0 };
        }
        stats[type].count++;
        if (task.status === '已完成') {
          stats[type].completed++;
        }
        stats[type].total++;
      });
      
      return stats;
    }, {} as Record<string, { count: number; completed: number; total: number }>);
  }

  // 切换到执行模式
  function switchToExecutionMode() {
    viewMode.value = 'execution';
    ElMessage.success('已切换到任务执行模式');
  }

  // 切换到编辑模式
  function switchToEditMode() {
    viewMode.value = 'edit';
    ElMessage.success('已切换到任务编辑模式');
  }

  // 从后端加载项目数据（阶段和任务）
  async function loadProjectTasks(projectId: string) {
    if (!projectId || projectId === 'new') {
      console.log('⚠️ 项目ID无效，跳过数据加载');
      return;
    }

    try {
      console.log('📝 开始加载项目数据 - 项目ID:', projectId);
      
      // 1. 先加载所有阶段（包括空阶段）
      const stagesData = await getProjectStages(projectId);
      console.log('📝 从后端获取的阶段数据:', stagesData);
      
      // 2. 再加载所有任务
      const tasksData = await getProjectTasks(projectId);
      console.log('📝 从后端获取的任务数据:', tasksData);

      // 清空现有阶段数据，准备重新构建
      stages.value = [];

      // 3. 首先创建所有阶段（确保空阶段也被创建）
      const stageTypeOrder: Record<string, number> = { 'BEFORE': 0, 'DURING': 1, 'AFTER': 2 };
      const sortedStages = (stagesData || []).sort((a: any, b: any) => {
        return (stageTypeOrder[a.type] || 1) - (stageTypeOrder[b.type] || 1) || a.orderIndex - b.orderIndex;
      });

      sortedStages.forEach((stageInfo: any, index: number) => {
        const stage: Stage = {
          id: stageInfo.id,
          name: stageInfo.name,
          tasks: [], // 先创建空任务列表
          order: index,
          description: stageInfo.description || '', // 使用后端返回的真实描述
          status: stageInfo.status?.toLowerCase() || 'pending', // 使用后端返回的真实状态
          estimatedDuration: 0, // 稍后计算
        };
        
        stages.value.push(stage);
      });

      // 4. 然后将任务分配到对应的阶段
      if (tasksData && tasksData.length > 0) {
        tasksData.forEach(task => {
          const stageInfo = task.stage;
          const targetStage = stages.value.find(s => s.id === stageInfo.id);
          
          if (targetStage) {
        // 转换后端任务数据为前端格式
        const frontendTask: Task = {
          id: task.id,
          type: task.type,
          name: task.name,
          description: task.description || '',
          required: task.required,
          config: task.config || {},
          status: task.status === 'PENDING' ? '未开始' : 
                  task.status === 'ACTIVE' ? '进行中' : 
                  task.status === 'COMPLETED' ? '已完成' : '未开始',
          order: task.orderIndex,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
        
            targetStage.tasks.push(frontendTask);
          }
      });

        // 5. 对每个阶段的任务进行排序，并计算预计时长
        stages.value.forEach(stage => {
          stage.tasks.sort((a: Task, b: Task) => a.order - b.order);
          stage.estimatedDuration = stage.tasks.reduce((sum: number, task: Task) => {
             const config = getTaskTypeConfig(task.type);
             return sum + (config?.estimatedHours || 0);
          }, 0);
        });
      }

      // 6. 设置第一个阶段为活跃阶段
      if (stages.value.length > 0) {
        activeStageId.value = stages.value[0].id;
      }

      // 在加载完成后，根据项目状态设置视图模式
      const project = await getProject(projectId);
      const projectStatus = project?.status;
      
      if (projectStatus === 'ACTIVE') {
        viewMode.value = 'execution'; // 项目发布后自动切换到执行模式
        console.log('📋 项目状态为ACTIVE，自动切换到执行模式');
      } else {
        viewMode.value = 'edit'; // 草稿状态保持编辑模式
        console.log('📝 项目状态为DRAFT，保持编辑模式');
      }

      console.log('✅ 项目数据加载完成 - 阶段数:', stages.value.length, '总任务数:', tasksData?.length || 0);
      ElMessage.success('项目数据加载成功');
      
    } catch (error: any) {
      console.error('❌ 加载项目数据失败:', error);
      ElMessage.error('加载项目数据失败：' + (error?.message || '未知错误'));
    }
  }

  return {
    // 状态
    stages,
    activeStageId,
    activeStage,
    stageStats,
    
    // 任务类型配置（从常量文件中获取）
    getTaskTypeConfig,
    getTaskTypesByCategory,
    
    // 阶段管理
    addStage,
    removeStage,
    setActiveStage,
    setStageName,
    setStageDescription,
    updateStageStatus,
    duplicateStage,
    
    // 任务管理
    addTaskToStage,
    addTaskToActiveStage,
    updateTask,
    updateTaskConfig,
    removeTask,
    moveTaskToStage,
    addTasksBatch,
    
    // 统计信息
    getTaskStats,
    loadProjectTasks,
    
    // 新增：视图模式相关
    viewMode: readonly(viewMode),
    isExecutionMode,
    isEditMode,
    switchToExecutionMode,
    switchToEditMode,
  };
}); 