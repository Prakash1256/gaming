const {z} = require("zod");

const userSchemaEdit = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
    
  firstName: z
    .string()
    .min(1, "First name is required"),
    
  lastName: z
    .string()
    .optional(),

  passwordReset: z
    .boolean()
    .optional()
    .default(false),

  resendActivation: z
    .boolean()
    .optional()
    .default(false)
});

module.exports = {
    userSchemaEdit
}