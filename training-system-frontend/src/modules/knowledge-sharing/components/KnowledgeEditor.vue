<template>
  <div class="knowledge-editor">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="editor-form"
    >
      <!-- 基础信息 -->
      <div class="form-section">
        <h3 class="section-title">基础信息</h3>
        
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入知识标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="formData.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入知识摘要，简要描述知识内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择知识类型"
                class="w-full"
              >
                <el-option
                  v-for="option in typeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                >
                  <div class="flex items-center">
                    <el-icon class="mr-2">
                      <component :is="option.icon" />
                    </el-icon>
                    {{ option.label }}
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="可见性" prop="visibility">
              <el-select
                v-model="formData.visibility"
                placeholder="请选择可见性"
                class="w-full"
              >
                <el-option
                  v-for="option in visibilityOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                >
                  <div class="flex items-center">
                    <el-icon class="mr-2">
                      <component :is="option.icon" />
                    </el-icon>
                    {{ option.label }}
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="分类" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="请选择知识分类"
            filterable
            allow-create
            class="w-full"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            placeholder="请选择或输入标签"
            multiple
            filterable
            allow-create
            class="w-full"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </div>

      <!-- 封面图片 -->
      <div class="form-section">
        <h3 class="section-title">封面图片</h3>
        
        <el-form-item label="封面" prop="coverImage">
          <div class="cover-upload">
            <el-upload
              ref="coverUploadRef"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleCoverChange"
              accept="image/*"
              class="cover-uploader"
            >
              <div v-if="coverPreview" class="cover-preview">
                <img :src="coverPreview" alt="封面预览" />
                <div class="cover-overlay">
                  <el-icon><Edit /></el-icon>
                  <span>更换封面</span>
                </div>
              </div>
              <div v-else class="cover-placeholder">
                <el-icon class="cover-icon"><Plus /></el-icon>
                <div class="cover-text">点击上传封面</div>
                <div class="cover-tip">支持 JPG、PNG 格式，建议尺寸 16:9</div>
              </div>
            </el-upload>
            
            <div v-if="coverPreview" class="cover-actions">
              <el-button size="small" @click="removeCover">
                <el-icon><Delete /></el-icon>
                移除封面
              </el-button>
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- 内容编辑 -->
      <div class="form-section">
        <h3 class="section-title">内容编辑</h3>
        
        <el-form-item label="内容" prop="content">
          <div class="content-editor">
            <div class="editor-toolbar">
              <el-button-group>
                <el-button
                  v-for="tool in editorTools"
                  :key="tool.command"
                  size="small"
                  :class="{ active: tool.active }"
                  @click="execCommand(tool.command, tool.value)"
                >
                  <el-icon>
                    <component :is="tool.icon" />
                  </el-icon>
                </el-button>
              </el-button-group>
            </div>
            
            <div
              ref="editorRef"
              class="editor-content"
              contenteditable="true"
              :placeholder="contentPlaceholder"
              @input="handleContentInput"
              @paste="handlePaste"
            ></div>
            
            <div class="editor-status">
              <span class="word-count">字数：{{ contentWordCount }}</span>
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- 附件上传 -->
      <div class="form-section">
        <h3 class="section-title">附件资料</h3>
        
        <el-form-item label="附件">
          <div class="attachment-upload">
            <el-upload
              ref="attachmentUploadRef"
              :auto-upload="false"
              :on-change="handleAttachmentChange"
              :on-remove="handleAttachmentRemove"
              multiple
              class="attachment-uploader"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传附件
              </el-button>
              <template #tip>
                <div class="upload-tip">
                  支持上传文档、图片、视频等文件，单个文件不超过 50MB
                </div>
              </template>
            </el-upload>
          </div>
        </el-form-item>
      </div>

      <!-- 高级选项 -->
      <div class="form-section">
        <h3 class="section-title">高级选项</h3>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="允许评论">
              <el-switch v-model="formData.allowComments" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="允许评分">
              <el-switch v-model="formData.allowRating" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="通知关注者">
              <el-switch v-model="formData.notifyFollowers" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="定时发布">
              <el-date-picker
                v-model="formData.schedulePublish"
                type="datetime"
                placeholder="选择发布时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss.sssZ"
                :disabled-date="disabledDate"
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="关联培训">
          <el-select
            v-model="formData.relatedTraining"
            placeholder="选择关联的培训项目"
            multiple
            filterable
            class="w-full"
          >
            <el-option
              v-for="training in trainingOptions"
              :key="training.id"
              :label="training.name"
              :value="training.id"
            />
          </el-select>
        </el-form-item>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="editor-actions">
      <div class="actions-left">
        <el-button @click="handlePreview">
          <el-icon><View /></el-icon>
          预览
        </el-button>
      </div>
      
      <div class="actions-right">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ mode === 'edit' ? '更新' : '发布' }}
        </el-button>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="内容预览"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="preview-content">
        <h2 class="preview-title">{{ formData.title }}</h2>
        <div class="preview-meta">
          <el-tag :type="getTypeTagType(formData.type)">{{ getTypeLabel(formData.type) }}</el-tag>
          <span class="preview-category">{{ formData.category }}</span>
          <div class="preview-tags">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              size="small"
              class="mr-1"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="preview-summary">{{ formData.summary }}</div>
        <div class="preview-body" v-html="formData.content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import {
  Document,
  VideoPlay,
  Picture,
  Presentation,
  Files,
  Star,
  Globe,
  Lock,
  User,
  UserFilled,
  Plus,
  Edit,
  Delete,
  Upload,
  View,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  OrderedList
} from '@element-plus/icons-vue';
import type { KnowledgeFormData, KnowledgeType, KnowledgeVisibility } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

interface Props {
  mode?: 'create' | 'edit';
  initialData?: Partial<KnowledgeFormData>;
  knowledgeId?: string;
}

interface Emits {
  (e: 'success', data: any): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
});

const emit = defineEmits<Emits>();

const knowledgeStore = useKnowledgeStore();

// 表单引用
const formRef = ref<FormInstance>();
const editorRef = ref<HTMLElement>();
const coverUploadRef = ref();
const attachmentUploadRef = ref();

// 表单数据
const formData = ref<KnowledgeFormData>({
  title: '',
  summary: '',
  content: '',
  type: 'article',
  category: '',
  tags: [],
  visibility: 'public',
  allowComments: true,
  allowRating: true,
  notifyFollowers: false,
  ...props.initialData
});

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入知识标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在 5 到 100 个字符', trigger: 'blur' }
  ],
  summary: [
    { required: true, message: '请输入知识摘要', trigger: 'blur' },
    { min: 10, max: 500, message: '摘要长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入知识内容', trigger: 'blur' },
    { min: 50, message: '内容不能少于 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择知识类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择知识分类', trigger: 'change' }
  ],
  visibility: [
    { required: true, message: '请选择可见性', trigger: 'change' }
  ]
};

// 选项数据
const typeOptions = [
  { value: 'article', label: '文章', icon: Document },
  { value: 'video', label: '视频', icon: VideoPlay },
  { value: 'document', label: '文档', icon: Files },
  { value: 'presentation', label: '演示文稿', icon: Presentation },
  { value: 'case_study', label: '案例研究', icon: Star },
  { value: 'best_practice', label: '最佳实践', icon: Star }
];

const visibilityOptions = [
  { value: 'public', label: '公开', icon: Globe },
  { value: 'internal', label: '内部', icon: UserFilled },
  { value: 'department', label: '部门', icon: User },
  { value: 'private', label: '私有', icon: Lock }
];

const categoryOptions = ref([
  '前端开发',
  '后端开发',
  '架构设计',
  '数据库',
  '运维部署',
  '项目管理',
  '产品设计',
  '测试质量'
]);

const tagOptions = ref([
  'Vue3',
  'React',
  'Angular',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'Docker',
  'Kubernetes',
  'MySQL',
  'Redis',
  '微服务',
  '架构设计',
  '性能优化',
  '最佳实践'
]);

const trainingOptions = ref([
  { id: '1', name: '前端技术培训班' },
  { id: '2', name: '后端架构师训练营' },
  { id: '3', name: '全栈开发实战课程' }
]);

// 编辑器相关
const editorTools = [
  { command: 'bold', icon: Bold, active: false },
  { command: 'italic', icon: Italic, active: false },
  { command: 'underline', icon: Underline, active: false },
  { command: 'insertUnorderedList', icon: List, active: false },
  { command: 'insertOrderedList', icon: OrderedList, active: false },
  { command: 'createLink', icon: Link, active: false }
];

const contentPlaceholder = '请输入知识内容，支持富文本编辑...';

// 状态
const loading = ref(false);
const previewVisible = ref(false);
const coverPreview = ref<string>('');

// 计算属性
const contentWordCount = computed(() => {
  return formData.value.content.replace(/<[^>]*>/g, '').length;
});

// 方法
const getTypeLabel = (type: KnowledgeType) => {
  return typeOptions.find(option => option.value === type)?.label || type;
};

const getTypeTagType = (type: KnowledgeType) => {
  const typeMap: Record<KnowledgeType, string> = {
    article: 'primary',
    video: 'success',
    document: 'info',
    presentation: 'warning',
    case_study: 'danger',
    best_practice: 'primary'
  };
  return typeMap[type] || 'primary';
};

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now();
};

// 封面处理
const handleCoverChange = (file: UploadFile) => {
  if (file.raw) {
    // 验证文件类型
    if (!file.raw.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件！');
      return;
    }
    
    // 验证文件大小
    if (file.raw.size / 1024 / 1024 > 5) {
      ElMessage.error('图片大小不能超过 5MB！');
      return;
    }
    
    formData.value.coverImage = file.raw;
    
    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file.raw);
  }
};

const removeCover = () => {
  formData.value.coverImage = undefined;
  coverPreview.value = '';
  coverUploadRef.value?.clearFiles();
};

// 附件处理
const handleAttachmentChange = (file: UploadFile, fileList: UploadFile[]) => {
  // 验证文件大小
  if (file.raw && file.raw.size / 1024 / 1024 > 50) {
    ElMessage.error('文件大小不能超过 50MB！');
    return;
  }
  
  formData.value.attachments = fileList.map(f => f.raw).filter(Boolean) as File[];
};

const handleAttachmentRemove = (file: UploadFile, fileList: UploadFile[]) => {
  formData.value.attachments = fileList.map(f => f.raw).filter(Boolean) as File[];
};

// 编辑器处理
const execCommand = (command: string, value?: string) => {
  if (command === 'createLink') {
    const url = prompt('请输入链接地址:');
    if (url) {
      document.execCommand(command, false, url);
    }
  } else {
    document.execCommand(command, false, value);
  }
  
  // 更新内容
  handleContentInput();
};

const handleContentInput = () => {
  if (editorRef.value) {
    formData.value.content = editorRef.value.innerHTML;
  }
};

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain');
  if (text) {
    document.execCommand('insertText', false, text);
  }
};

// 表单操作
const handlePreview = () => {
  previewVisible.value = true;
};

const handleCancel = () => {
  ElMessageBox.confirm('确定要取消编辑吗？未保存的内容将会丢失。', '确认取消', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning'
  }).then(() => {
    emit('cancel');
  }).catch(() => {
    // 用户取消
  });
};

const handleSaveDraft = async () => {
  try {
    loading.value = true;
    
    // 这里可以调用保存草稿的API
    ElMessage.success('草稿保存成功');
  } catch (error) {
    ElMessage.error('保存草稿失败');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    loading.value = true;
    
    if (props.mode === 'create') {
      const result = await knowledgeStore.createKnowledge(formData.value);
      ElMessage.success('知识创建成功');
      emit('success', result);
    } else if (props.mode === 'edit' && props.knowledgeId) {
      const result = await knowledgeStore.updateKnowledge(props.knowledgeId, formData.value);
      ElMessage.success('知识更新成功');
      emit('success', result);
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  if (props.mode === 'edit' && props.initialData?.content) {
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = props.initialData.content || '';
      }
    });
  }
  
  if (props.initialData?.coverImage && typeof props.initialData.coverImage === 'string') {
    coverPreview.value = props.initialData.coverImage;
  }
});
</script>

<style scoped lang="scss">
.knowledge-editor {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.editor-form {
  .form-section {
    margin-bottom: 32px;
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .section-title {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      border-bottom: 2px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }
}

.cover-upload {
  .cover-uploader {
    :deep(.el-upload) {
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
    }
  }
  
  .cover-preview {
    position: relative;
    width: 300px;
    height: 169px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .cover-placeholder {
    width: 300px;
    height: 169px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8c939d;
    
    .cover-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .cover-text {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .cover-tip {
      font-size: 12px;
      color: #a8abb2;
    }
  }
  
  .cover-actions {
    margin-top: 8px;
  }
}

.content-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  
  .editor-toolbar {
    padding: 8px 12px;
    border-bottom: 1px solid #dcdfe6;
    background: #f5f7fa;
    
    .el-button-group {
      .el-button {
        &.active {
          background: #409eff;
          color: white;
        }
      }
    }
  }
  
  .editor-content {
    min-height: 300px;
    padding: 12px;
    outline: none;
    
    &:empty::before {
      content: attr(placeholder);
      color: #a8abb2;
    }
  }
  
  .editor-status {
    padding: 8px 12px;
    border-top: 1px solid #dcdfe6;
    background: #f5f7fa;
    font-size: 12px;
    color: #909399;
    display: flex;
    justify-content: space-between;
  }
}

.attachment-upload {
  .upload-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
  }
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
  
  .actions-right {
    display: flex;
    gap: 12px;
  }
}

.preview-content {
  .preview-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #303133;
  }
  
  .preview-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .preview-category {
      color: #606266;
      font-size: 14px;
    }
    
    .preview-tags {
      display: flex;
      gap: 4px;
    }
  }
  
  .preview-summary {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    color: #606266;
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .preview-body {
    line-height: 1.8;
    color: #303133;
    
    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin: 20px 0 12px 0;
      font-weight: 600;
    }
    
    :deep(p) {
      margin: 12px 0;
    }
    
    :deep(ul), :deep(ol) {
      margin: 12px 0;
      padding-left: 24px;
    }
    
    :deep(a) {
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.w-full {
  width: 100%;
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}
</style> 