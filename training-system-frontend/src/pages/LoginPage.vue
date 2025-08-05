<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>培训管理系统</h2>
        <p>{{ isLogin ? '用户登录' : '用户注册' }}</p>
      </div>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item v-if="!isLogin" prop="realName">
          <el-input 
            v-model="form.realName" 
            placeholder="请输入真实姓名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item v-if="!isLogin" prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="请输入邮箱"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item v-if="!isLogin" prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请确认密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-button"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
        
        <div class="login-footer">
          <el-link type="primary" @click="toggleMode">
            {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm } from 'element-plus';
import { login, register } from '@/api/modules/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<InstanceType<typeof ElForm>>();
const loading = ref(false);
const isLogin = ref(true);

const form = reactive({
  username: '',
  password: '',
  realName: '',
  email: '',
  confirmPassword: ''
});

const rules = computed(() => {
  const baseRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在6-20个字符', trigger: 'blur' }
    ]
  };

  if (!isLogin.value) {
    return {
      ...baseRules,
      realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '真实姓名长度在2-10个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule: any, value: string, callback: any) => {
            if (value !== form.password) {
              callback(new Error('两次输入密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    };
  }

  return baseRules;
});

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  // 清空表单
  Object.keys(form).forEach(key => {
    form[key as keyof typeof form] = '';
  });
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    let result;
    if (isLogin.value) {
      result = await login({
        username: form.username,
        password: form.password
      });
    } else {
      result = await register({
        username: form.username,
        password: form.password,
        email: form.email,
        realName: form.realName
      });
    }

    // 保存token到localStorage
    localStorage.setItem('token', result.token);
    
    // 更新用户store
    userStore.login({
      id: result.user.id,
      name: result.user.realName,
      role: result.user.roles[0] || 'student',
      department: '默认部门',
      email: result.user.email,
      avatar: '',
      permissions: result.user.roles
    });

    ElMessage.success(isLogin.value ? '登录成功' : '注册成功');
    
    // 跳转到主页
    router.push('/training-management/dashboard');
  } catch (error) {
    console.error('Authentication error:', error);
    ElMessage.error(isLogin.value ? '登录失败' : '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

:deep(.el-input__inner) {
  height: 45px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style> 