import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '../utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const otherUsers = ref([])

  // 初始化用户
  const initializeUser = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      if (userData.role === 'admin' && !sessionStorage.getItem('adminToken')) {
        localStorage.removeItem('user')
        return
      }
      user.value = userData
      isAuthenticated.value = true
    }
  }

  // 用户注册
  const register = async (userData) => {
    try {
      const response = await userService.registerUser(userData)
      setUser(response)
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  // 用户登录
  const login = async (credentials) => {
    try {
      const response = await userService.loginUser(credentials.email, credentials.password)
      setUser(response)
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 设置用户信息
  const setUser = (userData) => {
    const { adminToken, ...safeUser } = userData
    if (adminToken) sessionStorage.setItem('adminToken', adminToken)
    user.value = safeUser
    isAuthenticated.value = true
    localStorage.setItem('user', JSON.stringify(safeUser))
  }

  // 登出
  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    otherUsers.value = []
    localStorage.removeItem('user')
    sessionStorage.removeItem('adminToken')
  }

  // 更新用户个人信息
  const updateUserProfile = async (profileData, classId = null, avatar = null) => {
    if (!user.value) return
    
    try {
      const updateData = { profileData, classId, avatar }
      const updatedUser = await userService.updateUser(user.value.email, updateData)
      
      // 更新本地存储的用户信息
      user.value = updatedUser
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return updatedUser
    } catch (error) {
      console.error('更新用户资料失败:', error)
      throw error
    }
  }

  // 获取所有其他用户
  const fetchOtherUsers = async () => {
    if (!user.value) return []
    
    try {
      const users = await userService.getAllUsers(user.value.email)
      // 确保每个用户都有profile字段
      otherUsers.value = users.map(user => ({
        ...user,
        profile: user.profile || {
          name: user.name || '',
          hometown: user.hometown || '',
          phone: user.phone || '',
          hobbies: user.hobbies || [],
          bio: user.bio || ''
        }
      }))
      return otherUsers.value
    } catch (error) {
      console.error('获取其他用户失败:', error)
      otherUsers.value = []
      return []
    }
  }

  // 获取特定用户信息
  const fetchUserById = async (email) => {
    try {
      const userData = await userService.getUserByEmail(email)
      // 确保返回的数据结构与前端期望的一致
      // 如果返回的用户数据没有profile字段，添加一个
      if (!userData.profile) {
        userData.profile = {
          name: userData.name || '',
          hometown: userData.hometown || '',
          phone: userData.phone || '',
          hobbies: userData.hobbies || [],
          bio: userData.bio || ''
        }
      }
      return userData
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 搜索用户
  const searchUsers = async (searchParams) => {
    try {
      const response = await userService.searchUsers(searchParams)
      return response
    } catch (error) {
      console.error('搜索用户失败:', error)
      throw error
    }
  }

  // 删除用户（管理员功能）
  const deleteUser = async (email) => {
    if (!user.value) {
      throw new Error('您没有权限执行此操作')
    }
    
    try {
      const response = await userService.deleteUserByAdmin(email)
      await fetchOtherUsers()
      return response
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  const createUserByAdmin = async (userData) => {
    const response = await userService.createUserByAdmin(userData)
    await fetchOtherUsers()
    return response
  }

  const resetUserPassword = async (email) => {
    const response = await userService.resetUserPasswordByAdmin(email)
    return response
  }

  const changeAdminPassword = async (passwords) => {
    const response = await userService.changeAdminPassword(passwords)
    sessionStorage.setItem('adminToken', response.adminToken)
    return response
  }

  return {
    user,
    isAuthenticated,
    otherUsers,
    initializeUser,
    register,
    login,
    setUser,
    logout,
    updateUserProfile,
    fetchOtherUsers,
    fetchUserById,
    searchUsers,
    deleteUser,
    createUserByAdmin,
    resetUserPassword,
    changeAdminPassword
  }
})
