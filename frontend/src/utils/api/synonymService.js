/**
 * 同义词API服务
 * 封装同义词相关的API请求
 */

import { get, post, put, del } from './request';

/**
 * 获取所有同义词组
 * @returns {Promise} 同义词组列表
 */
export const getAllSynonymGroups = () => {
  return get('/synonyms');
};

/**
 * 获取扁平化同义词
 * @returns {Promise} 扁平化同义词列表
 */
export const getFlatSynonyms = () => {
  return get('/synonyms/all');
};

/**
 * 添加同义词组
 * @param {Object} synonymGroup - 同义词组对象，包含name、category和synonyms字段
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 添加结果
 */
export const addSynonymGroup = (synonymGroup) => {
  return post('/synonyms', synonymGroup);
};

/**
 * 更新同义词组
 * @param {string} id - 同义词组ID
 * @param {Object} updateData - 更新数据
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 更新结果
 */
export const updateSynonymGroup = (id, updateData) => {
  return put(`/synonyms/${id}`, updateData);
};

/**
 * 删除同义词组
 * @param {string} id - 同义词组ID
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 删除结果
 */
export const deleteSynonymGroup = (id) => {
  return del(`/synonyms/${id}`);
};

/**
 * 初始化默认同义词组
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 初始化结果
 */
export const initializeDefaultSynonyms = () => {
  return post('/synonyms/init');
};

export default {
  getAllSynonymGroups,
  getFlatSynonyms,
  addSynonymGroup,
  updateSynonymGroup,
  deleteSynonymGroup,
  initializeDefaultSynonyms
};
