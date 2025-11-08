const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").default("Contact"),
  message: z.string().min(1, "Message is required"),
});

module.exports = contactSchema;
