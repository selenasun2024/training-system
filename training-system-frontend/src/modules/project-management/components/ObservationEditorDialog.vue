<template>
  <el-dialog v-model="visible" title="观察记录" width="480px" @close="onClose">
    <el-form :model="form" label-width="70px">
      <el-form-item label="学员">
        <el-input v-model="form.traineeName" disabled />
      </el-form-item>
      <el-form-item label="内容">
        <el-input type="textarea" v-model="form.content" rows="4" />
      </el-form-item>
      <el-form-item label="标签">
        <el-select 
          v-model="tagStr" 
          multiple 
          filterable
          allow-create 
          default-first-option 
          placeholder="输入标签内容并回车，或选择已有标签"
          style="width: 100%"
          @change="handleTagChange"
        >
          <!-- 预设的常用标签选项 -->
          <el-option label="积极主动" value="积极主动" />
          <el-option label="团队合作" value="团队合作" />
          <el-option label="学习能力强" value="学习能力强" />
          <el-option label="沟通表达" value="沟通表达" />
          <el-option label="创新思维" value="创新思维" />
          <el-option label="执行力强" value="执行力强" />
          <el-option label="需要改进" value="需要改进" />
          <el-option label="待观察" value="待观察" />
        </el-select>
        <!-- 标签显示区域 -->
        <div style="margin-top: 8px;" v-if="tagStr.length > 0">
          <el-tag 
            v-for="tag in tagStr" 
            :key="tag" 
            closable 
            @close="removeTag(tag)"
            style="margin-right: 4px; margin-bottom: 4px;"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { ObservationTarget } from '@/types/observation'

interface Props {
  modelValue: boolean
  target?: ObservationTarget
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = ref(props.modelValue)
watch(() => props.modelValue, v => (visible.value = v))
watch(visible, v => emit('update:modelValue', v))

const form = reactive({
  traineeName: '',
  content: '',
  tags: [] as string[],
})
const tagStr = ref<string[]>([])

watch(() => props.target, t => {
  if (t) {
    form.traineeName = t.traineeName
    form.content = t.record?.content || ''
    form.tags = t.record?.tags || []
    tagStr.value = [...form.tags]
  }
}, { immediate: true })

function onClose() {
  visible.value = false
}

// 处理标签变化
function handleTagChange(tags: string[]) {
  console.log('📝 标签更新:', tags);
  form.tags = [...tags];
}

// 删除标签
function removeTag(tagToRemove: string) {
  const index = tagStr.value.indexOf(tagToRemove);
  if (index > -1) {
    tagStr.value.splice(index, 1);
    form.tags = [...tagStr.value];
  }
}

function save() {
  form.tags = [...tagStr.value]
  console.log('💾 保存观察记录:', { content: form.content, tags: form.tags });
  emit('saved', { content: form.content, tags: form.tags })
  visible.value = false
}
</script> 