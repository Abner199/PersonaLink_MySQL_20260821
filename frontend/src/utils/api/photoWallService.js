import { get } from './request'

// 照片墙数据始终按登录用户所属班级读取，避免将其他班的资料加载到浏览器。
export const getClassPhotoWall = (classId) => get(`/photowall/class/${encodeURIComponent(classId)}`)
export const getAllPhotoWall = () => get('/photowall')

export default { getClassPhotoWall, getAllPhotoWall }
