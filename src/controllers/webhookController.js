// src/controllers/webhookController.js
import * as WebhookService from '../services/webhookService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getWebhooks = catchAsync(async (req, res) => {
  const webhooks = await WebhookService.getWebhooks();
  res.status(200).json({
    success: true,
    data: webhooks,
  });
});

export const createWebhook = catchAsync(async (req, res) => {
  const webhook = await WebhookService.createWebhook(req.body);
  res.status(201).json({
    success: true,
    data: webhook,
    message: 'Webhook configuration created',
  });
});

export const deleteWebhook = catchAsync(async (req, res) => {
  await WebhookService.deleteWebhook(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Webhook configuration deleted',
  });
});
