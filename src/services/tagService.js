// src/services/tagService.js
import * as TagRepository from "../repositories/tagRepository.js";
import { AppError } from "../utils/AppError.js";
import { pool } from "../db/database.js";

export const getAllTags = async () => {
  return await TagRepository.findAll();
};

export const getTagById = async (id) => {
  const tag = await TagRepository.findById(id);
  if (!tag) throw new AppError("Tag not found", 404);
  return tag;
};

export const createTag = async (data) => {
  const existing = await TagRepository.findByName(data.name);
  if (existing) throw new AppError("Tag name already exists", 409);

  return await TagRepository.create(data.name);
};

export const updateTag = async (id, data) => {
  const tag = await TagRepository.findById(id);
  if (!tag) throw new AppError("Tag not found", 404);

  const existingName = await TagRepository.findByName(data.name);
  if (existingName && existingName.id !== parseInt(id))
    throw new AppError("Tag name already exists", 409);

  return await TagRepository.update(id, data.name);
};

export const deleteTag = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tag = await TagRepository.findById(id, client);
    if (!tag) throw new AppError("Tag not found", 404);

    await TagRepository.removeTaskRelations(id, client);
    const deleted = await TagRepository.deleteById(id, client);

    await client.query("COMMIT");
    return deleted;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
