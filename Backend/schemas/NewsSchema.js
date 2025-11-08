const { z } = require("zod");

const NewsSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
});

module.exports = { NewsSchema };