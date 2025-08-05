# API接口设计详细说明

## 目录

- [1. API设计总览](#1-api设计总览)
- [2. 培训服务API](#2-培训服务api)
- [3. 执行服务API](#3-执行服务api)
- [4. 评价服务API](#4-评价服务api)
- [5. 用户服务API](#5-用户服务api)
- [6. 消息服务API](#6-消息服务api)
- [7. 文件服务API](#7-文件服务api)
- [8. 集成服务API](#8-集成服务api)

---

## 1. API设计总览

### 1.1 服务端口分配

| 服务名称 | 端口 | 基础路径 | 主要职责 |
|---------|------|----------|----------|
| **auth-service** | 8001 | `/api/v1/auth` | 认证授权 |
| **user-service** | 8002 | `/api/v1/users` | 用户管理 |
| **training-service** | 8003 | `/api/v1/training` | 培训核心业务 |
| **execution-service** | 8004 | `/api/v1/execution` | 培训执行 |
| **evaluation-service** | 8005 | `/api/v1/evaluation` | 评价评估 |
| **message-service** | 8006 | `/api/v1/messages` | 消息通知 |
| **file-service** | 8007 | `/api/v1/files` | 文件管理 |
| **integration-service** | 8008 | `/api/v1/integration` | 系统集成 |

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-12-01T10:30:00Z",
  "traceId": "trace_12345"
}
```

### 1.3 通用状态码

| 状态码 | 含义 | 使用场景 |
|-------|------|----------|
| 200 | 成功 | 操作成功 |
| 400 | 参数错误 | 请求参数验证失败 |
| 401 | 未认证 | Token无效或过期 |
| 403 | 无权限 | 权限验证失败 |
| 404 | 资源不存在 | 查询的资源不存在 |
| 500 | 服务器错误 | 内部异常 |

## 2. 培训服务API (training-service)

### 2.1 项目管理接口

#### 2.1.1 创建培训项目

```http
POST /api/v1/training/projects
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectName": "新员工培训项目",
  "projectType": "NEWCOMER",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "enabledModules": {
    "schedule": true,
    "budget": true,
    "resources": true,
    "division": true,
    "program": true
  },
  "participants": [
    {
      "userId": 123,
      "role": "STUDENT"
    }
  ]
}
```

**响应：**
```json
{
  "code": 200,
  "message": "项目创建成功",
  "data": {
    "projectId": "PRJ_2024001",
    "projectCode": "PRJ_2024001",
    "status": "DRAFT"
  }
}
```

#### 2.1.2 查询项目列表

```http
GET /api/v1/training/projects?page=1&size=10&status=ACTIVE&type=NEWCOMER
Authorization: Bearer {token}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "total": 25,
    "pages": 3,
    "current": 1,
    "records": [
      {
        "projectId": "PRJ_2024001",
        "projectName": "新员工培训项目",
        "projectType": "NEWCOMER",
        "status": "ACTIVE",
        "creatorName": "张三",
        "startDate": "2024-01-15",
        "endDate": "2024-01-20",
        "participantCount": 20
      }
    ]
  }
}
```

#### 2.1.3 项目详情查询

```http
GET /api/v1/training/projects/{projectId}
Authorization: Bearer {token}
```

### 2.2 计划管理接口

#### 2.2.1 创建培训计划

```http
POST /api/v1/training/plans
Content-Type: application/json
Authorization: Bearer {token}

{
  "planName": "2024年新员工培训计划",
  "planType": "NEWCOMER",
  "responsibleId": 123,
  "deadline": "2024-01-10",
  "content": {
    "objectives": ["熟悉公司文化", "掌握基本技能"],
    "duration": 5,
    "participantCount": 20
  },
  "approvalFlow": {
    "approvers": [456, 789],
    "requireAll": true
  }
}
```

#### 2.2.2 计划协作分享

```http
POST /api/v1/training/plans/{planId}/share
Content-Type: application/json
Authorization: Bearer {token}

{
  "collaborators": [
    {
      "userId": 456,
      "sections": ["objectives", "schedule"]
    }
  ]
}
```

### 2.3 方案管理接口

#### 2.3.1 提交方案审批

```http
POST /api/v1/training/programs/{projectId}/submit
Content-Type: application/json
Authorization: Bearer {token}

{
  "programData": {
    "schedule": {...},
    "budget": {...},
    "resources": {...},
    "division": {...}
  },
  "approvalComments": "方案已完善，请审核"
}
```

## 3. 执行服务API (execution-service)

### 3.1 任务管理接口

#### 3.1.1 创建培训任务

```http
POST /api/v1/execution/tasks
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "PRJ_2024001",
  "taskType": "LECTURE",
  "taskName": "公司文化讲座",
  "scheduleTime": "2024-01-15T09:00:00Z",
  "duration": 120,
  "participants": [123, 456, 789],
  "instructor": 999,
  "location": "会议室A",
  "requirements": {
    "needsAttendance": true,
    "needsMeeting": true
  }
}
```

#### 3.1.2 查询任务列表

```http
GET /api/v1/execution/tasks?projectId=PRJ_2024001&type=LECTURE&status=PENDING
Authorization: Bearer {token}
```

### 3.2 考勤管理接口

#### 3.2.1 创建签到任务

```http
POST /api/v1/execution/attendance/tasks
Content-Type: application/json
Authorization: Bearer {token}

{
  "taskId": "TASK_001",
  "signInMethods": ["QR_CODE", "LOCATION"],
  "signInWindow": {
    "startTime": "2024-01-15T08:45:00Z",
    "endTime": "2024-01-15T09:15:00Z"
  },
  "rules": {
    "lateMinutes": 15,
    "allowManualSignIn": true
  }
}
```

#### 3.2.2 学员签到

```http
POST /api/v1/execution/attendance/sign-in
Content-Type: application/json
Authorization: Bearer {token}

{
  "taskId": "TASK_001",
  "method": "QR_CODE",
  "signInData": {
    "qrCode": "QRCODE_12345",
    "location": {
      "latitude": 39.9042,
      "longitude": 116.4074
    }
  }
}
```

### 3.3 作业管理接口

#### 3.3.1 发布作业

```http
POST /api/v1/execution/assignments
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "PRJ_2024001",
  "title": "企业文化学习心得",
  "description": "请结合培训内容，写一份1000字的学习心得",
  "deadline": "2024-01-20T18:00:00Z",
  "participants": [123, 456, 789],
  "requirements": {
    "minWords": 1000,
    "allowAttachments": true,
    "needsPresentation": true
  }
}
```

#### 3.3.2 提交作业

```http
POST /api/v1/execution/assignments/{assignmentId}/submit
Content-Type: multipart/form-data
Authorization: Bearer {token}

content: "这是我的学习心得..."
attachments: [file1.pdf, file2.docx]
```

### 3.4 考试管理接口

#### 3.4.1 创建考试

```http
POST /api/v1/execution/exams
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "PRJ_2024001",
  "examName": "企业文化知识考试",
  "examTime": "2024-01-18T14:00:00Z",
  "duration": 90,
  "participants": [123, 456, 789],
  "questions": [
    {
      "type": "SINGLE_CHOICE",
      "question": "公司成立于哪一年？",
      "options": ["2010", "2011", "2012", "2013"],
      "answer": "2011",
      "score": 10
    }
  ],
  "rules": {
    "allowRetake": false,
    "randomOrder": true
  }
}
```

#### 3.4.2 提交答卷

```http
POST /api/v1/execution/exams/{examId}/submit
Content-Type: application/json
Authorization: Bearer {token}

{
  "answers": [
    {
      "questionId": "Q001",
      "answer": "2011"
    }
  ],
  "submitTime": "2024-01-18T15:25:00Z"
}
```

## 4. 评价服务API (evaluation-service)

### 4.1 问卷管理接口

#### 4.1.1 创建问卷

```http
POST /api/v1/evaluation/surveys
Content-Type: application/json
Authorization: Bearer {token}

{
  "surveyName": "培训效果评价问卷",
  "projectId": "PRJ_2024001",
  "targetType": "PROJECT",
  "questions": [
    {
      "type": "RATING",
      "question": "您对本次培训的总体满意度？",
      "scale": 5,
      "required": true
    },
    {
      "type": "TEXT",
      "question": "请提出改进建议",
      "required": false
    }
  ],
  "settings": {
    "anonymous": false,
    "deadline": "2024-01-25T23:59:59Z"
  }
}
```

#### 4.1.2 提交问卷

```http
POST /api/v1/evaluation/surveys/{surveyId}/submit
Content-Type: application/json
Authorization: Bearer {token}

{
  "answers": [
    {
      "questionId": "Q001",
      "answer": "5"
    },
    {
      "questionId": "Q002",
      "answer": "希望增加更多实操环节"
    }
  ]
}
```

### 4.2 推荐管理接口

#### 4.2.1 提名优秀学员

```http
POST /api/v1/evaluation/recommendations
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "PRJ_2024001",
  "nominees": [
    {
      "userId": 123,
      "category": "EXCELLENT_STUDENT",
      "evaluation": {
        "leadership": 5,
        "innovation": 4,
        "collaboration": 5
      },
      "comments": "表现突出，积极参与，具有很强的学习能力"
    }
  ]
}
```

### 4.3 证书管理接口

#### 4.3.1 批量生成证书

```http
POST /api/v1/evaluation/certificates/batch-generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "PRJ_2024001",
  "certificateType": "COMPLETION",
  "template": "STANDARD_TEMPLATE",
  "recipients": [
    {
      "userId": 123,
      "qualificationData": {
        "attendanceRate": 95,
        "finalScore": 88
      }
    }
  ]
}
```

## 5. 消息服务API (message-service)

### 5.1 通知发送接口

#### 5.1.1 发送通知

```http
POST /api/v1/messages/notifications/send
Content-Type: application/json
Authorization: Bearer {token}

{
  "templateId": "TRAINING_NOTIFICATION",
  "recipients": [123, 456, 789],
  "channels": ["APP", "WECHAT"],
  "variables": {
    "projectName": "新员工培训项目",
    "startTime": "2024-01-15 09:00"
  },
  "sendTime": "IMMEDIATE"
}
```

### 5.2 群聊管理接口

#### 5.2.1 创建培训群

```http
POST /api/v1/messages/groups
Content-Type: application/json
Authorization: Bearer {token}

{
  "groupName": "新员工培训-第一组",
  "groupType": "TRAINING_GROUP",
  "projectId": "PRJ_2024001",
  "members": [123, 456, 789],
  "settings": {
    "announcement": "欢迎加入新员工培训群！",
    "allowMemberInvite": false
  }
}
```

## 6. 文件服务API (file-service)

### 6.1 文件上传接口

#### 6.1.1 上传文件

```http
POST /api/v1/files/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [binary data]
category: TRAINING_MATERIAL
projectId: PRJ_2024001
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "fileId": "FILE_12345",
    "fileName": "课件.pdf",
    "fileSize": 2048576,
    "downloadUrl": "https://files.example.com/FILE_12345"
  }
}
```

#### 6.1.2 批量下载

```http
POST /api/v1/files/batch-download
Content-Type: application/json
Authorization: Bearer {token}

{
  "fileIds": ["FILE_001", "FILE_002", "FILE_003"],
  "archiveName": "第一组作业.zip"
}
```

## 7. 集成服务API (integration-service)

### 7.1 MCP系统集成

#### 7.1.1 推送待办事项

```http
POST /api/v1/integration/mcp/todo
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": 123,
  "title": "完成企业文化学习心得",
  "description": "请在1月20日前提交学习心得",
  "deadline": "2024-01-20T18:00:00Z",
  "relatedId": "PRJ_2024001",
  "type": "TRAINING_TASK"
}
```

#### 7.1.2 同步日程

```http
POST /api/v1/integration/mcp/calendar
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": 123,
  "title": "新员工培训",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-20T17:00:00Z",
  "location": "培训中心",
  "type": "TRAINING_EVENT"
}
```

### 7.2 人事系统集成

#### 7.2.1 推送标签

```http
POST /api/v1/integration/hr/tags
Content-Type: application/json
Authorization: Bearer {token}

{
  "users": [
    {
      "userId": 123,
      "tags": [
        {
          "category": "TRAINING",
          "value": "新员工培训-优秀学员",
          "source": "PRJ_2024001"
        }
      ]
    }
  ]
}
```

#### 7.2.2 更新培训记录

```http
POST /api/v1/integration/hr/training-records
Content-Type: application/json
Authorization: Bearer {token}

{
  "users": [
    {
      "userId": 123,
      "trainingRecord": {
        "projectName": "新员工培训项目",
        "completionDate": "2024-01-20",
        "score": 88,
        "certificate": "COMPLETION",
        "hours": 40
      }
    }
  ]
}
```

### 7.3 企业微信集成

#### 7.3.1 发送群消息

```http
POST /api/v1/integration/wechat/group-message
Content-Type: application/json
Authorization: Bearer {token}

{
  "groupId": "GROUP_12345",
  "messageType": "TEXT",
  "content": "各位同学，明天的培训请准时参加！",
  "atUsers": [123, 456]
}
```

---

## API设计说明

### 🔄 **事件驱动集成**
各服务通过事件总线(RocketMQ)进行异步通信，减少直接依赖

### 🔐 **安全机制**
- JWT Token认证
- 请求签名验证
- 敏感数据加密传输

### 📊 **监控埋点**
每个API调用都包含traceId，支持全链路监控

### ⚡ **性能优化**
- 分页查询
- 批量操作
- 缓存策略

这套API设计完全支撑了30个功能模块的业务需求，为前端开发提供了完整的数据接口。 