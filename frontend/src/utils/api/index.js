/**
 * API服务统一导出
 * 提供所有API服务的统一入口
 */

import userService from './userService';
import classService from './classService';
import synonymService from './synonymService';
import photoWallService from './photoWallService';

export {
  userService,
  classService,
  synonymService,
  photoWallService
};

export default {
  userService,
  classService,
  synonymService,
  photoWallService
};
