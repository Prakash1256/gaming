const { z } = require("zod");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

const registerPayloadSchema = z
  .object({
    firstName: z
      .string("FirstName is required")
      .min(3, "FirstName must be at least 3 characters long"),
    lastName: z
      .string("LastName")
      .optional("LastName is reqired must be at least 3 characters long"),
    email: z.string("Email is required").email("Invalid email address"),
    username: z
      .string("Username is required")
      .trim()
      .min(1, "Username is required"),
    role: z.enum(['manager', 'player']).default("Player"),
    password: z
      .string("password is required")
      .min(6, "Password must be at least 6 characters long") // Minimum length check
      .regex(
        passwordRegex,
        "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ), // Detailed regex check

    confirmPassword: z.string(),
  })
  .refine((val) => val.confirmPassword === val.password, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // This ensures the error message goes to confirmPassword
  });

const changePasswordSchema = z
  .object({
    oldPassword: z
      .string("password is required")
      .min(6, "Password must be at least 6 characters long") // Minimum length check
      .regex(
        passwordRegex,
        "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    newPassword: z
      .string("password is required")
      .min(6, "Password must be at least 6 characters long") // Minimum length check
      .regex(
        passwordRegex,
        "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string("confirm password is required"),
  })
  .refine((val) => val.confirmPassword === val.password, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // This ensures the error message goes to confirmPassword
  });


const updateCredentialsSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  email: z.string().email("Invalid email").optional(),
  newPassword: z.string("password is required")
      .min(6, "Password must be at least 6 characters long") // Minimum length check
      .regex(
        passwordRegex,
        "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If one of newPassword or confirmPassword is provided, both must be
  if (data.newPassword || data.confirmPassword) {
    return data.newPassword && data.confirmPassword;
  }
  return true;
}, {
  message: "Both new password and confirm password are required.",
  path: ["confirmPassword"]
}).refine((data) => {
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "New password and confirm password must match.",
  path: ["confirmPassword"]
}).refine((data) => {
  return data.email || data.newPassword;
}, {
  message: "You must provide a new email or new password to update.",
});

const loginPayloadSchema = z.object({
  emailOrUsername: z.string("") || z.string().email("Invalid email address"),
  password: z.string(),
});

const forgetPasswordPayloadSchema = z.object({
  email: z.string("Email is required").email("Invalid Email Address"),
});

const forgetpasswordResetPayloadSchema = z
  .object({
    // email: z.string("Email is required").email("Inavlid Email"),
    password: z
      .string("password is required")
      .min(6, "Password must be at least 6 characters long") // Minimum length check
      .regex(
        passwordRegex,
        "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((val) => val.confirmPassword === val.password, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // This ensures the error message goes to confirmPassword
  });

module.exports = {
  registerPayloadSchema,
  loginPayloadSchema,
  forgetPasswordPayloadSchema,
  forgetpasswordResetPayloadSchema,
  forgetpasswordResetPayloadSchema,
  changePasswordSchema,
  updateCredentialsSchema
};
