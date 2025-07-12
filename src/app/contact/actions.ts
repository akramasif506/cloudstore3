'use server';

import { z } from 'zod';

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export async function sendMessage(values: z.infer<typeof contactSchema>) {
  // For demonstration purposes, we'll log the message to the server console.
  // In a real application, you would save this to a database or send an email.
  console.log('New contact message received:');
  console.log('Name:', values.name);
  console.log('Email:', values.email);
  console.log('Message:', values.message);

  // You can add database logic here.
  // For example: await db.insert(messages).values(values);

  return { success: true };
}
