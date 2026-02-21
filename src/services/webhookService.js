// src/services/webhookService.js
import { prisma } from '../lib/prisma.js';
import axios from 'axios';
import { logger } from '../utils/logger.js';

export const createWebhook = async (data) => {
  return await prisma.webhook.create({
    data: {
      name: data.name,
      url: data.url,
      events: data.events, // e.g. ['task.created', 'task.updated']
      secret: data.secret,
    },
  });
};

export const getWebhooks = async () => {
  return await prisma.webhook.findMany();
};

export const deleteWebhook = async (id) => {
  return await prisma.webhook.delete({
    where: { id: Number(id) },
  });
};

export const trigger = async (event, payload) => {
  // Find webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
      events: {
        has: event,
      },
    },
  });

  if (webhooks.length === 0) {
    return;
  }

  // Dispatch in background
  try {
    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          await axios.post(
            webhook.url,
            {
              event,
              payload,
              timestamp: new Date(),
            },
            {
              headers: {
                'X-Webhook-Secret': webhook.secret || '',
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            },
          );
          logger.debug(`Webhook ${webhook.id} triggered for ${event}`);
        } catch (error) {
          logger.error(`Webhook ${webhook.id} failed:`, {
            error: error.message,
          });
          // Logic to disable webhook after N failures?
        }
      }),
    );
  } catch (error) {
    logger.error('Error in Webhook trigger:', { error: error.message });
  }
};
