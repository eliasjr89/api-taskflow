import { catchAsync } from '../utils/catchAsync.js';
import * as RoleService from '../services/roleService.js';

export const getRoles = catchAsync(async (req, res) => {
  const roles = await RoleService.getAllRoles();
  res.status(200).json({ success: true, data: roles });
});

export const getPermissions = catchAsync(async (req, res) => {
  const permissions = await RoleService.getAllPermissions();
  res.status(200).json({ success: true, data: permissions });
});

export const createRole = catchAsync(async (req, res) => {
  const role = await RoleService.createRole(req.body);
  res.status(201).json({ success: true, data: role });
});

export const updateRole = catchAsync(async (req, res) => {
  const role = await RoleService.updateRole(req.params.id, req.body);
  res.status(200).json({ success: true, data: role });
});

export const deleteRole = catchAsync(async (req, res) => {
  await RoleService.deleteRole(req.params.id);
  res.status(200).json({ success: true, message: 'Role deleted successfully' });
});
