// src/controllers/tagsController.js
import * as TagService from "../services/tagService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllTags = catchAsync(async (req, res) => {
  const tags = await TagService.getAllTags();
  res.status(200).json({
    success: true,
    data: tags,
    message: "Tags fetched successfully",
  });
});

export const getTagById = catchAsync(async (req, res) => {
  const tag = await TagService.getTagById(req.params.id);
  res.status(200).json({
    success: true,
    data: tag,
    message: "Tag fetched successfully",
  });
});

export const createTag = catchAsync(async (req, res) => {
  const tag = await TagService.createTag(req.body);
  res.status(201).json({
    success: true,
    data: tag,
    message: "Tag created successfully",
  });
});

export const updateTag = catchAsync(async (req, res) => {
  const tag = await TagService.updateTag(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: tag,
    message: "Tag updated successfully",
  });
});

export const deleteTag = catchAsync(async (req, res) => {
  await TagService.deleteTag(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: "Tag deleted successfully",
  });
});
