/**
 * 用户API服务
 * 封装用户相关的API请求
 */

import { get, post, put, del } from './request';

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @returns {Promise} 注册结果
 */
export const registerUser = (userData) => {
  return post('/users/register', userData);
};

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise} 登录结果
 */
export const loginUser = (email, password) => {
  return post('/users/login', { email, password });
};

/**
 * 获取当前用户信息
 * @param {string} email - 用户邮箱
 * @returns {Promise} 用户信息
 */
export const getCurrentUser = (email) => {
  return get(`/users/current/${email}`);
};

/**
 * 更新用户信息
 * @param {string} email - 用户邮箱
 * @param {Object} updateData - 更新数据
 * @returns {Promise} 更新结果
 */
export const updateUser = (email, updateData) => {
  return put(`/users/update/${email}`, updateData);
};

/**
 * 获取所有用户（除当前用户）
 * @param {string} currentEmail - 当前用户邮箱
 * @returns {Promise} 用户列表
 */
export const getAllUsers = (currentEmail) => {
  return get(`/users/all/${currentEmail}`);
};

/**
 * 获取特定用户信息
 * @param {string} email - 用户邮箱
 * @returns {Promise} 用户信息
 */
export const getUserByEmail = (email) => {
  return get(`/users/${email}`);
};

/**
 * 搜索用户
 * @param {Object} searchParams - 搜索参数
 * @returns {Promise} 搜索结果
 */
export const searchUsers = (searchParams) => {
  return post('/users/search', searchParams);
};

/**
 * 管理员删除用户
 * @param {string} email - 要删除的用户邮箱
 * @param {Object} adminCredentials - 管理员凭证
 * @returns {Promise} 删除结果
 */
export const deleteUserByAdmin = (email) => {
  return del('/users/admin/delete', { email });
};

export const createUserByAdmin = (userData) => {
  return post('/users/admin/create', userData);
};

export const resetUserPasswordByAdmin = (email) => {
  return put(`/users/admin/reset-password/${encodeURIComponent(email)}`);
};

export const changeAdminPassword = (passwords) => {
  return put('/users/admin/password', passwords);
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser,
  getAllUsers,
  getUserByEmail,
  searchUsers,
  deleteUserByAdmin,
  createUserByAdmin,
  resetUserPasswordByAdmin,
  changeAdminPassword
};
