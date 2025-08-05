import { defineStore } from 'pinia';
import * as groupApi from '@/api/modules/group';

export interface GroupMember {
  role: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
}

export interface TrainingGroup {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export const useGroupStore = defineStore('trainingGroups', {
  state: () => ({
    groups: [] as TrainingGroup[],
    loading: false,
    error: null as Error | null,
  }),
  actions: {
    async fetchGroups(projectId: string) {
      this.loading = true;
      this.error = null;
      try {
        console.log('🔄 fetchGroups - 请求项目小组数据:', projectId);
        const data = await groupApi.getGroupsByProject(projectId);
        console.log('🔄 fetchGroups - 收到响应数据:', data);
        this.groups = data;
        console.log('🔄 fetchGroups - 设置后的groups:', this.groups);
      } catch (err: any) {
        console.error('❌ fetchGroups - 请求失败:', err);
        this.error = err;
      } finally {
        this.loading = false;
      }
    },
    async addGroup(projectId: string, groupData: { name: string; description?: string }) {
      this.loading = true;
      try {
        console.log('🔄 addGroup - 创建小组:', { projectId, groupData });
        const result = await groupApi.createGroup(projectId, groupData);
        console.log('🔄 addGroup - 创建成功:', result);
        await this.fetchGroups(projectId); // 重新加载列表
        return result; // 🔧 返回创建的小组数据
      } catch (err: any) {
        console.error('❌ addGroup - 创建失败:', err);
        this.error = err;
        throw err; // 抛出错误，以便UI层可以捕获
      } finally {
        this.loading = false;
      }
    },
    async removeGroup(groupId: string, projectId: string) {
      try {
        console.log('🔄 removeGroup - 删除小组:', groupId);
        await groupApi.deleteGroup(groupId);
        // 直接从state中移除，避免重新请求整个列表
        this.groups = this.groups.filter(g => g.id !== groupId);
        console.log('🔄 removeGroup - 删除成功');
      } catch (err: any) {
        console.error('❌ removeGroup - 删除失败:', err);
        this.error = err;
        throw err;
      }
    },
    async addMember(groupId: string, memberData: { userId: string; role: string }, projectId: string) {
      try {
        console.log('🔄 addMember - 添加成员:', { groupId, memberData });
        const result = await groupApi.addGroupMember(groupId, memberData);
        console.log('🔄 addMember - 添加成功:', result);
        await this.fetchGroups(projectId); // 添加成员后，刷新整个项目的小组数据以更新成员列表
      } catch (err: any) {
        console.error('❌ addMember - 添加失败:', err);
        this.error = err;
        throw err;
      }
    },
    async removeMember(groupId: string, userId: string, projectId: string) {
      try {
        console.log('🔄 removeMember - 移除成员:', { groupId, userId });
        await groupApi.removeGroupMember(groupId, userId);
        console.log('🔄 removeMember - 移除成功');
        await this.fetchGroups(projectId); // 移除成员后，同样刷新数据
      } catch (err: any) {
        console.error('❌ removeMember - 移除失败:', err);
        this.error = err;
        throw err;
      }
    },
  },
}); 