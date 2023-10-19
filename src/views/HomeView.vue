<template>
  <main>
    <el-row :gutter="12" class="bt10">
      <el-col :span="8">
        <el-card shadow="hover" class="card-font"> 简洁 </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="card-font"> 大气 </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="card-font"> 好用 </el-card>
      </el-col>
    </el-row>
    <div class="bt10">
      <el-card shadow="hover">
        <el-row :gutter="20">
          <el-col :span="6">
            <div>
              <el-statistic
                group-separator=","
                :precision="2"
                :value="data.value2"
                :title="data.title"
              ></el-statistic>
            </div>
          </el-col>
          <el-col :span="6">
            <div>
              <el-statistic title="男女比">
                <template slot="formatter"> 456/2 </template>
              </el-statistic>
            </div>
          </el-col>
          <el-col :span="6">
            <div>
              <el-statistic
                group-separator=","
                :precision="2"
                decimal-separator="."
                :value="data.value1"
                :title="data.title"
              >
                <template slot="prefix">
                  <i class="el-icon-s-flag" style="color: red"></i>
                </template>
                <template slot="suffix">
                  <i class="el-icon-s-flag" style="color: blue"></i>
                </template>
              </el-statistic>
            </div>
          </el-col>
          <el-col :span="6">
            <div>
              <el-statistic :value="data.like ? 521 : 520" title="Feedback">
                <template slot="suffix">
                  <span @click="data.like = !data.like" class="like">
                    <i
                      class="el-icon-star-on"
                      style="color: red"
                      v-show="!!data.like"
                    ></i>
                    <i class="el-icon-star-off" v-show="!data.like"></i>
                  </span>
                </template>
              </el-statistic>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
    <el-row :gutter="12">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>更新</span>
              <el-button class="button" text>2023-10</el-button>
            </div>
          </template>
          <div v-for="o in 4" :key="o" class="text item">
            {{ 'List item ' + o }}
          </div>
        </el-card>
      </el-col>
    </el-row>
  </main>
</template>

<script lang="ts" setup>
const data = {
  like: true,
  value1: 4154.564,
  value2: 1314,
  title: '增长人数'
}
</script>

<style scoped lang="scss">
.card-font {
  font-size: 3em;
}
.bt10 {
  padding-bottom: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
