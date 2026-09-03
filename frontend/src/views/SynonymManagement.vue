<template>
  <div class="synonym-management">
    <router-link to="/home" class="back-button">
      <span class="back-icon">←</span>
      <span>返回首页</span>
    </router-link>
    
    <div class="page-header">
      <h1>同义词管理</h1>
      <p>管理员可以添加、删除和管理同义词组，用于智能匹配用户输入</p>
      
      <!-- 表单容器 -->
      <div class="forms-container">
        <!-- 添加同义词组表单 -->
        <div class="form-section">
          <h3>添加同义词组</h3>
          <div class="form-row">
            <div class="form-group">
              <label>同义词组名称</label>
              <input 
                v-model="newSynonymName" 
                placeholder="例如：球类运动"
                type="text"
              />
            </div>
            <div class="form-group">
              <label>同义词组分类</label>
              <input 
                v-model="newSynonymCategory" 
                placeholder="例如：运动"
                type="text"
              />
            </div>
          </div>
          <div class="form-group">
            <label>同义词（每行一个，至少两个）</label>
            <textarea 
              v-model="newSynonymsText" 
              placeholder="例如：&#10;羽毛球&#10;羽球&#10;badminton"
              rows="3"
            ></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="addSynonymGroup">添加同义词组</button>
            <div v-if="addSynonymMessage" :class="['message', addSynonymSuccess ? 'success' : 'error']">
              {{ addSynonymMessage }}
            </div>
          </div>
        </div>
        
        <!-- 编辑同义词组表单 -->
        <div v-if="showEditForm" class="form-section">
          <h3>编辑同义词组</h3>
          <div class="form-row">
            <div class="form-group">
              <label>同义词组名称</label>
              <input 
                :value="editForm.name" 
                readonly
                class="readonly-input"
                type="text"
              />
            </div>
            <div class="form-group">
              <label>同义词组分类</label>
              <input 
                :value="editForm.category" 
                readonly
                class="readonly-input"
                type="text"
              />
            </div>
          </div>
          <div class="form-group">
            <label>同义词列表（至少两个）</label>
            <div class="synonym-edit-container">
              <div class="synonym-list-edit">
                <div v-for="(synonym, index) in editSynonymsList" :key="index" class="synonym-item">
                  <input 
                    v-model="editSynonymsList[index]" 
                    type="text"
                    class="synonym-input"
                  />
                  <button class="btn btn-danger btn-sm remove-btn" @click="removeSynonym(index)">删除</button>
                </div>
              </div>
              <button class="btn btn-secondary add-synonym-btn" @click="addNewSynonym">添加新同义词</button>
            </div>
          </div>
          <div class="edit-form-footer">
              <button class="btn btn-primary" @click="updateSynonymGroup">保存修改</button>
              <button class="btn btn-secondary" @click="closeEditForm">取消</button>
            </div>
            <div v-if="editMessage" :class="['message', editSuccess ? 'success' : 'error']">
              {{ editMessage }}
            </div>
        </div>
      </div>
    </div>
    
    <div>
      <div class="synonym-list-container">
        <div class="synonym-list">
          <h3>现有同义词组</h3>
          <div v-if="synonymGroups.length === 0" class="empty-state">
            <p>暂无同义词组</p>
          </div>
          <div v-else>
            <div v-for="(group, index) in synonymGroups" :key="group.id || index" class="synonym-group">
              <div class="synonym-content">
                <div class="synonym-group-info">
                  <h4>{{ group.name }} ({{ group.category }})</h4>
                </div>
                <div class="synonym-words">
                  <span v-for="(word, wordIndex) in group.synonyms" :key="wordIndex" class="synonym-word">
                    {{ word }}
                  </span>
                </div>
                <div class="synonym-actions">
                  <button class="btn btn-secondary btn-sm" @click="openEditModal(group)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="deleteSynonymGroup(group.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      

      
      <div class="usage-explanation">
        <h3>使用说明</h3>
        <ul>
          <li>同义词组用于解决同类爱好不同名称导致的检索问题</li>
          <li>例如：将"羽毛球"、"羽球"、"badminton"设置为同义词组</li>
          <li>当用户搜索其中任何一个词时，系统会同时匹配所有同义词</li>
          <li>至少需要添加两个同义词才能组成一个同义词组</li>
          <li>系统会自动去重并转换为小写进行处理</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useSynonymStore } from '../stores/synonym';

export default {
  name: 'SynonymManagement',
  setup() {
    const synonymStore = useSynonymStore();
    
    // 同义词管理
    const synonymGroups = ref([]);
    const newSynonymName = ref('');
    const newSynonymCategory = ref('');
    const newSynonymsText = ref('');
    const addSynonymMessage = ref('');
    const addSynonymSuccess = ref(false);
    
    // 编辑同义词组
const showEditForm = ref(false);
const editForm = ref({
  id: null,
  name: '',
  category: '',
  synonymsText: ''
});
const editSynonymsList = ref([]);
const editMessage = ref('');
const editSuccess = ref(true);
    
    // 获取同义词列表
    const fetchSynonyms = async () => {
      try {
        const result = await synonymStore.fetchSynonyms();
        if (result && result.success) {
          // 保存完整的同义词组数据，包括ID
          synonymGroups.value = result.data;
        }
      } catch (error) {
        console.error('获取同义词失败:', error);
      }
    };
    
    // 添加同义词组
    const addSynonymGroup = async () => {
      addSynonymMessage.value = '';
      
      // 验证必填字段
      if (!newSynonymName.value.trim()) {
        addSynonymMessage.value = '请输入同义词组名称';
        addSynonymSuccess.value = false;
        return;
      }
      
      if (!newSynonymCategory.value.trim()) {
        addSynonymMessage.value = '请输入同义词组分类';
        addSynonymSuccess.value = false;
        return;
      }
      
      // 解析同义词文本
      const synonyms = newSynonymsText.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      if (synonyms.length < 2) {
        addSynonymMessage.value = '至少需要添加两个同义词';
        addSynonymSuccess.value = false;
        return;
      }
      
      try {
        // 创建同义词组对象
        const synonymGroup = {
          name: newSynonymName.value.trim(),
          category: newSynonymCategory.value.trim(),
          synonyms: synonyms
        };
        
        const result = await synonymStore.addSynonym(synonymGroup);
        if (result.success) {
          addSynonymMessage.value = result.message;
          addSynonymSuccess.value = true;
          newSynonymName.value = '';
          newSynonymCategory.value = '';
          newSynonymsText.value = '';
          await fetchSynonyms();
        } else {
          addSynonymMessage.value = result.message || '添加失败';
          addSynonymSuccess.value = false;
        }
      } catch (error) {
        addSynonymMessage.value = '添加失败: ' + error.message;
        addSynonymSuccess.value = false;
      }
    };
    
    // 删除同义词组
    const deleteSynonymGroup = async (id) => {
      if (!confirm('确定要删除这个同义词组吗？')) {
        return;
      }
      
      try {
        const result = await synonymStore.deleteSynonymGroup(id);
        if (result.success) {
          // 删除成功，刷新同义词列表
          await fetchSynonyms();
        } else {
          alert(result.message || '删除失败');
        }
      } catch (error) {
        console.error('删除同义词组失败:', error);
        alert('删除失败: ' + error.message);
      }
    };
    
    // 打开编辑表单
const openEditModal = (group) => {
  editForm.value = {
    id: group.id,
    name: group.name,
    category: group.category,
    synonymsText: group.synonyms.join('\n')
  };
  // 初始化同义词列表
  editSynonymsList.value = [...group.synonyms];
  editMessage.value = '';
  editSuccess.value = false;
  showEditForm.value = true;
};
    
    // 关闭编辑模态框
    const closeEditForm = () => {
  showEditForm.value = false;
  editForm.value = {
    id: null,
    name: '',
    category: '',
    synonymsText: ''
  };
  editSynonymsList.value = [];
  editMessage.value = '';
  editSuccess.value = false;
};
    
    // 更新同义词组
const updateSynonymGroup = async () => {
  editMessage.value = '';
  
  // 验证必填字段
  if (!editForm.value.name.trim()) {
    editMessage.value = '请输入同义词组名称';
    editSuccess.value = false;
    return;
  }
  
  if (!editForm.value.category.trim()) {
    editMessage.value = '请输入同义词组分类';
    editSuccess.value = false;
    return;
  }
  
  // 验证同义词列表
  const synonyms = editSynonymsList.value
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (synonyms.length < 2) {
    editMessage.value = '至少需要添加两个同义词';
    editSuccess.value = false;
    return;
  }
  
  try {
    // 创建更新对象
    const updateData = {
      name: editForm.value.name.trim(),
      category: editForm.value.category.trim(),
      synonyms: synonyms
    };
    
    const result = await synonymStore.updateSynonym(editForm.value.id, updateData);
    if (result.success) {
      editMessage.value = result.message;
      editSuccess.value = true;
      await fetchSynonyms();
      // 2秒后关闭表单
      setTimeout(() => {
        closeEditForm();
      }, 2000);
    } else {
      editMessage.value = result.message || '更新失败';
      editSuccess.value = false;
    }
  } catch (error) {
    editMessage.value = '更新失败: ' + error.message;
    editSuccess.value = false;
  }
};

// 添加新同义词
const addNewSynonym = () => {
  editSynonymsList.value.push('');
};

// 删除同义词
const removeSynonym = (index) => {
  if (editSynonymsList.value.length > 2) {
    editSynonymsList.value.splice(index, 1);
  } else {
    editMessage.value = '至少需要保留两个同义词';
    editSuccess.value = false;
  }
};
    
    onMounted(fetchSynonyms);
    
    return {
      // 同义词管理
      synonymGroups,
      newSynonymName,
      newSynonymCategory,
      newSynonymsText,
      addSynonymMessage,
      addSynonymSuccess,
      fetchSynonyms,
      addSynonymGroup,
      deleteSynonymGroup,
      
      // 编辑同义词组
      showEditForm,
      editForm,
      editSynonymsList,
      editMessage,
      editSuccess,
      openEditModal,
      closeEditForm,
      updateSynonymGroup,
      addNewSynonym,
      removeSynonym
    };
  }
};
</script>

<style scoped>
.synonym-management {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  padding-top: 60px; /* 增加顶部内边距，确保返回按钮可见 */
}

.synonym-management > div {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

/* 表单容器布局 */
.forms-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.form-section {
  flex: 1;
  min-width: 300px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.form-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.page-header h1 {
  color: white;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

/* 编辑表单容器样式 */
.edit-form-container {
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.edit-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-form-header h3 {
  color: white;
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.edit-form-body {
  padding: 20px;
}

/* 只读输入框样式 */
.readonly-input {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  cursor: not-allowed;
}

/* 同义词编辑容器 */
.synonym-edit-container {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.05);
}

/* 同义词列表编辑区域 */
.synonym-list-edit {
  margin-bottom: 15px;
}

/* 单个同义词项 */
.synonym-item {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.synonym-item:last-child {
  margin-bottom: 0;
}

/* 同义词输入框 */
.synonym-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 删除按钮 */
.remove-btn {
  padding: 6px 12px;
  font-size: 14px;
  white-space: nowrap;
}

/* 添加同义词按钮 */
.add-synonym-btn {
  width: 100%;
  padding: 8px 0;
  border-style: dashed;
}

/* 小号按钮样式 */
.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

/* 编辑表单底部 */
.edit-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  min-width: 50px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.admin-verification {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.verification-form {
  max-width: 400px;
  margin: 0 auto;
}

.verification-form h3 {
  text-align: center;
  margin-bottom: 20px;
  color: white;
  font-size: 22px;
  font-weight: 500;
}

/* 同义词列表容器样式，添加滚动条 */
.synonym-list-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 30px;
  padding-right: 10px;
}

/* 自定义滚动条样式 */
.synonym-list-container::-webkit-scrollbar {
  width: 8px;
}

.synonym-list-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.synonym-list-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.synonym-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.synonym-list {
  margin-bottom: 0;
}

.synonym-group {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.synonym-group:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.synonym-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.synonym-group-info {
  margin-bottom: 5px;
}

.synonym-group-info h4 {
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.synonym-words {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.synonym-word {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.synonym-actions {
  display: flex;
  justify-content: flex-end;
}

.add-synonym {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.usage-explanation {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.usage-explanation h3 {
  color: white;
  margin-bottom: 15px;
  font-size: 22px;
  font-weight: 500;
}

.usage-explanation ul {
  padding-left: 20px;
}

.usage-explanation li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: white;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 16px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.btn-primary {
  background: rgba(76, 175, 80, 0.3);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: white;
}

.btn-primary:hover {
  background: rgba(76, 175, 80, 0.4);
  transform: translateY(-2px);
}

.btn-danger {
  background: rgba(244, 67, 54, 0.3);
  border: 1px solid rgba(244, 67, 54, 0.5);
  color: white;
}

.btn-danger:hover {
  background: rgba(244, 67, 54, 0.4);
  transform: translateY(-2px);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 14px;
}

.error-message {
  color: rgba(244, 67, 54, 0.9);
  margin-top: 10px;
  font-size: 14px;
}

.message {
  margin-top: 15px;
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: white;
}

.message.error {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.5);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: rgba(255, 255, 255, 0.7);
}

/* 添加返回按钮样式 */
.back-button {
  position: absolute;
  left: 20px;
  top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 16px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-decoration: none;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-icon {
  font-size: 18px;
  font-weight: bold;
}



.btn-secondary {
  background: rgba(158, 158, 158, 0.3);
  border: 1px solid rgba(158, 158, 158, 0.5);
  color: white;
}

.btn-secondary:hover {
  background: rgba(158, 158, 158, 0.4);
  transform: translateY(-2px);
}
</style>
