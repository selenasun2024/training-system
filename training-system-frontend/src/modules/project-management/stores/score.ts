import { defineStore } from 'pinia';
import { useTrainingStageStore } from './trainingStage';
import { useGroupStore } from './group';
import { ElMessage } from 'element-plus';

interface CustomScoreType {
  id: string;
  label: string;
  enabled: boolean;
  score: number;
}

interface RawScore {
  userId: string;
  name: string;
  groupId: string;
  groupName: string;
  exam: number;
  homework: number;
  attendance: number;
  [key: string]: string | number; // 添加索引签名以支持动态属性
}

interface WeightedScore extends RawScore {
  total: number;
  rank: number;
}

interface GroupRank {
  groupId: string;
  groupName: string;
  teamScore: number;
  rank: number;
}

export const useScoreStore = defineStore('score', {
  state: () => ({
    currentProjectId: '' as string,
    // 成绩策略（模式+各权重）
    policy: {
      mode: 'individual' as 'individual' | 'group' | 'combined',
      individualSettings: {
        categories: {
          exam: { label: '考试', enabled: true, score: 100 },
          homework: { label: '作业', enabled: true, score: 100 },
          attendance: { label: '考勤', enabled: true, score: 100, rules: { late: 1, vacation: 0, absent: 5 } },
          custom: {
            enabled: false,
            types: [] as Array<{
              id: string;
              label: string;
              enabled: boolean;
              score: number;
            }>,
          },
        } as Record<string, any>,
      },
      groupSettings: {
        categories: {
          cooperation: { label:'协同作业', enabled:true, excludedIds: [] as string[] },
          discussion: { label:'讨论', enabled:true, excludedIds: [] as string[] },
          attendance: { label:'考勤', enabled:true, rules: { late: 1, vacation: 0, absent: 5 } },
          custom: { 
            enabled: false,
            types: [] as Array<{
              id: string;
              label: string;
              enabled: boolean;
              score: number;
            }>,
          },
        } as Record<string, any>,
      },
      // 新增旧兼容权重字段
      individualWeights: {
        exam: 34,
        homework: 33,
        attendance: 33,
      } as Record<string, number>,
      groupWeights: {
        co_work: 100,
      } as Record<string, number>,
      combinedWeights: {
        individual: 80,
        group: 20,
      },
    },
    // 原始分数数据（来自考试/作业/考勤模块或后端接口）
    rawScores: [] as RawScore[],
    // 计算后带有总分和排名的数据
    ranking: [] as WeightedScore[],
    groupScores: {} as Record<string, number>,
    groupRanking: [] as GroupRank[],
    // 每个小组的协同作业明细（任务名称+得分）
    groupTaskDetails: {} as Record<string, { taskId: string; taskName: string; score: number }[]>,
    // 发布状态
    published: false,
    loading: false,
  }),

  getters: {
    // 返回总分已排序的列表
    totalScores: (state) => state.ranking,
    coopExcluded: (state)=>state.policy.groupSettings.categories.cooperation.excludedIds,
    discExcluded: (state)=>state.policy.groupSettings.categories.discussion.excludedIds,
  },

  actions: {
    /**
     * 模拟拉取成绩数据
     */
    async fetchScores(projectId: string) {
      if(!projectId) return;
      this.currentProjectId = projectId;
      this.loading = true;
      try {
        console.log('🔍 fetchScores: 获取项目成绩 - 项目ID:', projectId);
        
        // 调用真实 API
        const { getProjectScores } = await import('@/api/modules/score');
        const response = await getProjectScores(projectId);
        const data = response?.data || response;
        
        console.log('📊 fetchScores: API返回数据:', data);
        
        if (data && data.students) {
          // 转换后端数据格式为前端期望的格式
          const formattedScores: RawScore[] = data.students.map((student: any) => ({
            userId: student.userId || student.id,
            name: student.name,
            groupId: student.groupId || 'default',
            groupName: student.groupName || '未分组',
            exam: student.exam || 0,
            homework: student.homework || 0,
            attendance: student.attendance || 0,
            total: student.total || 0,
            rank: student.rank || 0,
          }));
          
          console.log('✅ fetchScores: 格式化后的数据:', formattedScores);
          this.rawScores = formattedScores;
          
          // 设置小组数据
          if (data.groupScores) {
            this.groupScores = data.groupScores;
          }
          if (data.groupTaskDetails) {
            this.groupTaskDetails = data.groupTaskDetails;
          }
          
          this.calcTotal();
        } else {
          console.warn('⚠️ fetchScores: API返回数据格式异常:', data);
          // 如果API返回数据异常，使用空数据
          this.rawScores = [];
          this.groupScores = {};
          this.groupTaskDetails = {};
        }
        
      } catch (error) {
        console.error('❌ fetchScores: 获取成绩数据失败:', error);
        // API调用失败时，设置空数据而不是抛出错误
        this.rawScores = [];
        this.groupScores = {};
        this.groupTaskDetails = {};
        ElMessage.error('获取成绩数据失败，请检查项目设置');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 重新计算总分与排名
     */
    calcTotal() {
      const { policy } = this;
      const indCats = policy.individualSettings.categories;
      
      const totals = this.rawScores.map((s) => {
        let totalScore = 0;
        let totalWeight = 0;
        
        // 计算基础项目分数
        if (indCats.exam.enabled) {
          totalScore += s.exam * (indCats.exam.score || 0);
          totalWeight += indCats.exam.score || 0;
        }
        if (indCats.homework.enabled) {
          totalScore += s.homework * (indCats.homework.score || 0);
          totalWeight += indCats.homework.score || 0;
        }
        if (indCats.attendance.enabled) {
          totalScore += s.attendance * (indCats.attendance.score || 0);
          totalWeight += indCats.attendance.score || 0;
        }
        
        // 计算自定义项目分数
        if (indCats.custom.enabled) {
          indCats.custom.types.forEach((type: CustomScoreType) => {
            if (type.enabled && s[type.id] !== undefined) {
              totalScore += (s[type.id] as number) * (type.score || 0);
              totalWeight += type.score || 0;
            }
          });
        }

        // 计算最终得分
        let total = totalWeight > 0 ? (totalScore / totalWeight) : 0;

        // 如果是综合模式，需要计算团队得分
        if (policy.mode === 'combined') {
          const teamScore = this.groupScores[s.groupId] ?? 0;
          total = total * (policy.combinedWeights.individual / 100) + 
                 teamScore * (policy.combinedWeights.group / 100);
        } else if (policy.mode === 'group') {
          total = 0; // 在纯团队模式下个人成绩表可忽略
        }

        return { ...s, total } as WeightedScore;
      });

      // 排序并生成排名
      totals.sort((a, b) => b.total - a.total);
      this.ranking = totals.map((t, idx) => ({ ...t, rank: idx + 1 }));

      // 计算小组排名
      const allGroups = new Map<string, string>();
      this.rawScores.forEach(s => {
        if (!allGroups.has(s.groupId)) {
          allGroups.set(s.groupId, s.groupName);
        }
      });
      
      const gList: GroupRank[] = Array.from(allGroups.entries()).map(([gid, gName])=>{
        const teamScore = this.groupScores[gid] || 0;
        return { groupId: gid, groupName: gName, teamScore, rank:0 };
      });

      gList.sort((a,b)=>b.teamScore-a.teamScore);
      gList.forEach((g,i)=>g.rank=i+1);
      this.groupRanking = gList;
    },

    /**
     * 发布成绩：调用后端接口并推送通知
     */
    async publish() {
      if (this.published) return;
      // TODO: 调用真实发布接口，例如 POST /projects/{currentProjectId}/scores/publish
      await new Promise((resolve) => setTimeout(resolve, 500)); // mock
      // 模拟推送：此处可接入通知模块
      console.log('[Mock] 成绩已发布，并已推送通知到项目群');
      this.published = true;
    },

    /** 更新评分策略 */
    setPolicy(newPolicy: Partial<typeof this.policy>) {
      this.policy = { ...this.policy, ...newPolicy } as any;
    },

    /**
     * 从协同任务聚合每个小组的得分明细
     * 调用时机：协同任务批阅结束或成绩页面加载
     */
    async refreshFromCooperation() {
      if (this.rawScores.length === 0) {
        await this.fetchScores(this.currentProjectId);
      }

      try {
        const stageStore = useTrainingStageStore();
        
        // NEW: 从 rawScores 获取所有小组，并初始化分数/明细
        const allGroups = new Map<string, string>();
        this.rawScores.forEach(s => {
          if (!allGroups.has(s.groupId)) {
            allGroups.set(s.groupId, s.groupName);
          }
        });

        const taskDetails: Record<string, { taskId: string; taskName: string; score: number }[]> = {};
        const groupScores: Record<string, number> = {};

        allGroups.forEach((_, gid) => {
          groupScores[gid] = 0;
          taskDetails[gid] = [];
        });
        
        const { cooperation: coopCat, discussion: discCat } = this.policy.groupSettings.categories;

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300));

        stageStore.stages.forEach((stage) => {
          // 遍历所有任务
          stage.tasks.forEach((task) => {
            let categoryEnabled = false;
            let isExcluded = false;

            // 🔧 修复：检查任务是否为相关类型，以及是否启用/排除
            if (task.type === 'homework' && task.config?.isCooperation) {
              // 标记为协同的作业任务
              categoryEnabled = coopCat.enabled;
              isExcluded = coopCat.excludedIds.includes(task.id);
            } else if (task.type === 'discussion') {
              categoryEnabled = discCat.enabled;
              isExcluded = discCat.excludedIds.includes(task.id);
            } else {
              return; // 非团队计分任务，跳过
            }

            // 如果类别被禁用或此任务被排除，则跳过
            if (!categoryEnabled || isExcluded) {
              return;
            }
            
            const scores = task.config?.groupScores || {};
            Object.entries(scores).forEach(([gid, s]) => {
              // taskDetails的初始化已在上文完成，这里直接push
              taskDetails[gid].push({ taskId: task.id, taskName: task.name, score: Number(s) });
              groupScores[gid] = (groupScores[gid] || 0) + Number(s);
            });
          });
        });

        // 更新 store 状态
        this.groupTaskDetails = taskDetails;
        this.groupScores = groupScores;
        this.calcTotal(); // 重新计算总分和排名
      } catch (error) {
        console.error('更新协同任务成绩失败:', error);
        throw error;
      }
    },

    /** 保存团队设置 */
    setGroupSettings(settings:any){
      this.policy.groupSettings = JSON.parse(JSON.stringify(settings));
    },
  },
}); 