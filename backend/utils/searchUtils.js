/**
 * 搜索工具函数
 * 统一处理搜索逻辑
 */

/**
 * 根据搜索类型和关键词过滤用户
 * @param {Array} users - 用户数组
 * @param {string} type - 搜索类型 (name, hometown, hobby, all)
 * @param {Array} matchTerms - 匹配词数组（包含原始搜索词和同义词）
 * @returns {Array} 过滤后的用户数组
 */
const filterUsersBySearchType = (users, type, matchTerms) => {
  switch (type) {
    case 'name':
      return users.filter(user => {
        const userName = (user.profile?.name || user.name || '').toLowerCase();
        return matchTerms.some(term => userName.includes(term));
      });
      
    case 'hometown':
      return users.filter(user => {
        const userHometown = (user.profile?.hometown || '').toLowerCase();
        return matchTerms.some(term => userHometown.includes(term));
      });
      
    case 'hobby':
      return users.filter(user => {
        // 兼容两种数据结构：profile.hobbies 和 hobbies
        const userHobbies = user.profile?.hobbies || user.hobbies || [];
        return userHobbies.some(hobby => 
          matchTerms.some(term => hobby.toLowerCase().includes(term))
        );
      });
      
    case 'all':
    default:
      return users.filter(user => {
        // 检查姓名
        const userName = (user.profile?.name || user.name || '').toLowerCase();
        if (matchTerms.some(term => userName.includes(term))) {
          return true;
        }
        
        // 检查家乡
        const userHometown = (user.profile?.hometown || '').toLowerCase();
        if (matchTerms.some(term => userHometown.includes(term))) {
          return true;
        }
        
        // 检查爱好
        // 兼容两种数据结构：profile.hobbies 和 hobbies
        const userHobbies = user.profile?.hobbies || user.hobbies || [];
        if (userHobbies.some(hobby => 
            matchTerms.some(term => hobby.toLowerCase().includes(term))
        )) {
          return true;
        }
        
        return false;
      });
  }
};

/**
 * 获取与搜索词相关的同义词
 * @param {Object} db - 数据库对象
 * @param {string} searchQuery - 搜索词
 * @returns {Array} 同义词数组
 */
const getSynonymsForSearch = (db, searchQuery) => {
  let synonyms = [];
  
  // 优先使用新的同义词组结构
  if (db.data.synonymGroups && db.data.synonymGroups.length > 0) {
    // 查找与搜索词相关的同义词组
    const synonymGroup = db.data.synonymGroups.find(group => 
      group.synonyms.some(synonym => synonym.toLowerCase().includes(searchQuery) || searchQuery.includes(synonym.toLowerCase()))
    );
    
    if (synonymGroup) {
      synonyms = synonymGroup.synonyms.filter(synonym => 
        synonym.toLowerCase() !== searchQuery
      );
    }
  } 
  // 兼容旧的同义词结构
  else if (db.data.synonyms && db.data.synonyms.length > 0) {
    // 查找与搜索词相关的同义词
    const synonymGroup = db.data.synonyms.find(group => 
      group.some(synonym => synonym.toLowerCase().includes(searchQuery) || searchQuery.includes(synonym.toLowerCase()))
    );
    
    if (synonymGroup) {
      synonyms = synonymGroup.filter(synonym => 
        synonym.toLowerCase() !== searchQuery
      );
    }
  }
  
  return synonyms;
};

module.exports = {
  filterUsersBySearchType,
  getSynonymsForSearch
};