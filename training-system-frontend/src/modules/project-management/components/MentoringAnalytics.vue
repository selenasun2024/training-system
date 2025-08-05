<template>
  <div class="mentoring-analytics">
    <!-- 数据分析概览 -->
    <div class="analytics-overview">
      <el-card>
        <h3>师徒带教数据分析</h3>
        <p>全面了解带教效果和发展趋势</p>
      </el-card>
    </div>

    <!-- 关键指标 -->
    <div class="key-metrics">
      <el-card>
        <h4>整体效果</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-value">85%</span>
            <span class="metric-label">完成率</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">4.2</span>
            <span class="metric-label">平均评分</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">68</span>
            <span class="metric-label">活跃对数</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">92%</span>
            <span class="metric-label">满意度</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 趋势图表 -->
    <div class="trend-charts">
      <el-card>
        <h4>发展趋势</h4>
        <div class="chart-placeholder">
          <p>图表数据加载中...</p>
        </div>
      </el-card>
    </div>

    <!-- 部门分析 -->
    <div class="department-analysis">
      <el-card>
        <h4>部门对比</h4>
        <div class="department-list">
          <div class="department-item">
            <span class="dept-name">技术部</span>
            <span class="dept-progress">
              <el-progress :percentage="85" />
            </span>
          </div>
          <div class="department-item">
            <span class="dept-name">产品部</span>
            <span class="dept-progress">
              <el-progress :percentage="78" />
            </span>
          </div>
          <div class="department-item">
            <span class="dept-name">运营部</span>
            <span class="dept-progress">
              <el-progress :percentage="92" />
            </span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// 数据分析组件
</script>

<style scoped>
.mentoring-analytics {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analytics-overview h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.analytics-overview p {
  margin: 0;
  color: #666;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

.department-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.department-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dept-name {
  width: 80px;
  font-size: 14px;
  color: #333;
}

.dept-progress {
  flex: 1;
}
</style> 