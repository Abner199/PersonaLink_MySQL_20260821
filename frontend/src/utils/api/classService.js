/**
 * 班级API服务
 * 封装班级相关的API请求
 */

import { get, post, put, del } from './request';

/**
 * 获取所有班级
 * @returns {Promise} 班级列表
 */
export const getAllClasses = () => {
  return get('/classes');
};

/**
 * 根据ID获取班级
 * @param {string} id - 班级ID
 * @returns {Promise} 班级信息
 */
export const getClassById = (id) => {
  return get(`/classes/${id}`);
};

/**
 * 创建班级
 * @param {Object} classData - 班级数据
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 创建结果
 */
export const createClass = (classData) => {
  return post('/classes', classData);
};

/**
 * 更新班级信息
 * @param {string} id - 班级ID
 * @param {Object} updateData - 更新数据
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 更新结果
 */
export const updateClass = (id, updateData) => {
  return put(`/classes/${id}`, updateData);
};

/**
 * 删除班级
 * @param {string} id - 班级ID
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 删除结果
 */
export const deleteClass = (id) => {
  return del(`/classes/${id}`);
};

/**
 * 获取班级学生
 * @param {string} classId - 班级ID
 * @returns {Promise} 班级学生列表
 */
export const getClassStudents = (classId) => {
  return get(`/classes/${classId}/students`);
};

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents
};
