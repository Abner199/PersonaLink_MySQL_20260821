import { defineStore } from 'pinia'
import { ref } from 'vue'
import { classService } from '../utils/api'

export const useClassStore = defineStore('class', () => {
  const classes = ref([])
  const currentClass = ref(null)

  // 获取所有班级
  const fetchClasses = async () => {
    try {
      const response = await classService.getAllClasses()
      classes.value = response
      return response
    } catch (error) {
      console.error('获取班级列表失败:', error)
      throw error
    }
  }

  // 获取特定班级信息
  const fetchClassById = async (classId) => {
    try {
      const response = await classService.getClassById(classId)
      currentClass.value = response
      return response
    } catch (error) {
      console.error('获取班级信息失败:', error)
      throw error
    }
  }

  // 创建新班级（管理员）
  const createClass = async (classData) => {
    try {
      const response = await classService.createClass(classData)
      // 更新本地班级列表
      await fetchClasses()
      return response
    } catch (error) {
      console.error('创建班级失败:', error)
      throw error
    }
  }

  // 更新班级信息（管理员）
  const updateClass = async (classId, classData) => {
    try {
      const response = await classService.updateClass(classId, classData)
      // 更新本地班级列表
      await fetchClasses()
      return response
    } catch (error) {
      console.error('更新班级信息失败:', error)
      throw error
    }
  }

  // 删除班级（管理员）
  const deleteClass = async (classId) => {
    try {
      const response = await classService.deleteClass(classId)
      // 更新本地班级列表
      await fetchClasses()
      return response
    } catch (error) {
      console.error('删除班级失败:', error)
      throw error
    }
  }

  // 获取班级中的学生
  const fetchClassStudents = async (classId) => {
    try {
      const response = await classService.getClassStudents(classId)
      return response
    } catch (error) {
      console.error('获取班级学生失败:', error)
      throw error
    }
  }

  return {
    classes,
    currentClass,
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    fetchClassStudents
  }
})
