const { z, ZodError } = require("zod");

const tournamentSchema = z.object({
    name: z.string().min(1, "Tournament name is required"),
    // flyerImage: z.optional(),
    tournamentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID"),
    // startDateTime: z.date({
    // required_error: "Start date is required",
    // invalid_type_error: "Start date must be a valid date",
    // }),
    startDateTime: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
      })
    // } else if (!(val instanceof Date) || isNaN(val.getTime())) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: "Start date must be a valid date",
    //   });
    }
  }),
    endDateTime: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End Date is required",
      });
    // } else if (!(val instanceof Date) || isNaN(val.getTime())) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: "End date must be a valid date",
    //   });
    }
  }),
    tournamentType: z.string().min(1, "Tournament type is required"),
    game: z.string().min(1, "Game type is required"),
    description: z.string().optional(),
    // maxPlayer: z.number({
    //   required_error: "Max Player is required",
    // invalid_type_error: "Max Player is required",
    // }).int().positive().optional(),
    // entryFee: z.number({
    //   required_error: "Max Player is required",
    // invalid_type_error: "Max Player is required",
    // }).nonnegative("Entry fee must be a positive number"),
    maxPlayer: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max Player is required",
      });
    } else if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max Player must be a positive integer",
      });
    }
  }),

  entryFee: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Entry fee is required",
      });
    } else if (typeof val !== "number" || val < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Entry fee must be a positive number",
      });
    }
  }),
    ratingSystem: z.string().min(1, "Rating system is required"),
    // winnersRace: z.number().int().positive().optional(),
    // losersRace: z.number().int().positive().optional(),
    winnersRace: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Winners race is required",
      });
    } else if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Winners race must be a positive integer",
      });
    }
  }),

  losersRace: z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Losers race is required",
      });
    } else if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Losers race must be a positive integer",
      });
    }
  }),
    published: z.boolean().default(true)
    
});


// const tournamentSchema = z.object({
//     name: z.string().min(1, "Tournament name is required"),
//     flyerImage: z.string(),
//     tournamentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID"),
//     startDateTime: z.string().min(1, "Start Date is required"),
//     endDateTime: z.string().min(1, "End date is required"),
//     tournamentType: z.string().min(1, "Tournament type is required"),
//     game: z.string().min(1, "Game type is required"),
//     description: z.string().min(1, "Description is required"),
//     maxPlayer: z
//         .union([
//             z.number().int().positive(),
//             z.null().refine(() => false, {
//                 message: "Maxplayer is required",
//             })
//         ])
//         .optional(),
//     entryFee: z.number().nonnegative("Entry fee must be a positive number"),
//     ratingSystem: z.string().min(1, "Rating system is required"),
//     winnersRace: z.number().int().positive().optional(),
//     losersRace: z.number().int().positive().optional(),
//     published: z.boolean().default(false),
// });


// const tournamentSchema = z.object({
//     name: z.string().min(1, "Tournament name is required"),
//     flyerImage: z.any(),
//     tournamentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID"),
//     startDateTime: z.string().min(1, "Start Date is required"),
//     endDateTime: z.string().min(1, "End date is required"),
//     tournamentType: z.string().min(1, "Tournament type is required"),
//     game: z.string().min(1, "Game type is required"),
//     description: z.string().min(1, "Description is required"),

//     maxPlayer: z
//         .union([
//             z.number().int().positive(),
//             z.null().refine(() => false, { message: "Maxplayer is required" }),
//         ])
//         .optional(),

//     entryFee: z
//         .union([
//             z.number("Entry fee is required").nonnegative("Entry fee is required"),
//             z.null("Entry fee is required").refine(() => false, { message: "Entry fee is required" }),
//         ]),

//     ratingSystem: z.string().min(1, "Rating system is required"),
//     winnersRace: z.number().int().positive().optional(),
//     losersRace: z.number().int().positive().optional(),
//     published: z.boolean().default(false),
// });

// const tournamentSchema = z.object({
//   name: z.string().min(1, "Tournament name is required"),
//   flyerImage: z.any(),
//   tournamentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID"),
//   startDateTime: z.string().min(1, "Start Date is required"),
//   endDateTime: z.string().min(1, "End date is required"),
//   tournamentType: z.string().min(1, "Tournament type is required"),
//   game: z.string().min(1, "Game type is required"),
//   description: z.string().min(1, "Description is required"),

//   maxPlayer: z
//     .union([
//       z.number().int().positive(),
//       z.null().refine(() => false, { message: "Maxplayer is required" }),
//     ])
//     .optional(),

//   entryFee: z
//     .union([z.number().nonnegative(), z.string().transform((val) => {
//       const num = parseFloat(val);
//       if (isNaN(num)) {
//         throw new Error("Entry fee must be a valid number");
//       }
//       return num;
//     })])
//     .refine((value) => value === null || value >= 0, {
//       message: "Entry fee must be a non-negative number",
//     }),

//   ratingSystem: z.string().min(1, "Rating system is required"),
//   winnersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Winners race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   losersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Losers race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   published: z.boolean().default(false),
// });


// const tournamentSchema = z.object({
//   name: z.string().min(1, "Tournament name is required"),
//   flyerImage: z.any(),
//   tournamentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID"),
//   startDateTime: z.string().min(1, "Start Date is required"),
//   endDateTime: z.string().min(1, "End date is required"),
//   tournamentType: z.string().min(1, "Tournament type is required"),
//   game: z.string().min(1, "Game type is required"),
//   description: z.string().min(1, "Description is required"),

//   maxPlayer: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Maxplayer must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   entryFee: z
//     .union([z.number().nonnegative(), z.string().transform((val) => {
//       const num = parseFloat(val);
//       if (isNaN(num)) {
//         throw new Error("Entry fee must be a valid number");
//       }
//       return num;
//     })])
//     .refine((value) => value === null || value >= 0, {
//       message: "Entry fee must be a non-negative number",
//     }),

//   ratingSystem: z.string().min(1, "Rating system is required"),
//   winnersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Winners race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   losersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Losers race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   // Published field: handle boolean or string "true"/"false" input
//   published: z
//     .union([
//       z.boolean(),
//       z.string().transform((val) => {
//         if (val === "true") return true;
//         if (val === "false") return false;
//         throw new Error("Published must be a boolean or a string 'true'/'false'");
//       }),
//     ])
//     .default(true),
// });


// const tournamentSchema = z.object({
//   name: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Tournament name is required" }),
    
//   flyerImage: z.any(),
  
//   tournamentLocation: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && /^[0-9a-fA-F]{24}$/.test(val), { message: "Invalid venue ID" }),
    
//   startDateTime: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Start Date is required" }),
    
//   endDateTime: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "End date is required" }),
    
//   tournamentType: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Tournament type is required" }),
    
//   game: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Game type is required" }),
    
//   description: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Description is required" }),

//   maxPlayer: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Maxplayer is required");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   entryFee: z
//     .union([z.number().nonnegative(), z.string().transform((val) => {
//       const num = parseFloat(val);
//       if (isNaN(num)) {
//         throw new Error("Entry fee is required");
//       }
//       return num;
//     })])
//     .refine((value) => value === null || value >= 0, {
//       message: "Entry fee must be a non-negative number",
//     }),

//   ratingSystem: z
//     .string()
//     .nullable()
//     .refine((val) => val !== null, { message: "This field is required" })
//     .refine((val) => val && val.length > 0, { message: "Rating system is required" }),
    
//   winnersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Winners race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   losersRace: z
//     .union([
//       z.number().int().positive(),
//       z.string().transform((val) => {
//         const num = parseInt(val, 10);
//         if (isNaN(num)) {
//           throw new Error("Losers race must be a valid number");
//         }
//         return num;
//       }),
//     ])
//     .optional(),

//   // Published field: handle boolean or string "true"/"false" input
//   published: z
//     .union([
//       z.boolean(),
//       z.string().transform((val) => {
//         if (val === "true") return true;
//         if (val === "false") return false;
//         throw new Error("Published must be a boolean or a string 'true'/'false'");
//       }),
//     ])
//     .default(true),
// });

const addPlayerToTournamentSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  paid: z.boolean().optional(),
  status: z.string().optional().default("Tentative"),
  rating: z.number().default(0),
  forgorateReadableId: z.number().optional(),
  forgorateData: z.any().optional(),
});


const addMultiplePlayersToTournamentSchema = z.object({
  names: z.string(),
  status: z.string().optional().default("Tentative"),
  paid: z.boolean().default(false),
  rating: z.number().default(0)
})

const tournamentEditSignupSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  status: z.enum(["Confirmed", "Tentative", "Waiting"]),
  paid: z.boolean({message:"paid is required"}),
  rating: z.number().default(0)
});

const tournamentParticipantStatusBulkUpdateSchema = z.object({
  status: z.enum(["Confirmed","Tentative"]).default("Tentative")
});

const tournamentParticipantPaidStatusBulkUpdateSchema = z.object({
  paid: z.boolean().default(false),
});


// const tournamentSchema = z.object({
//   name: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   flyerImage: z.any(),
  
//   tournamentLocation: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     })
//     .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), { 
//       message: "Invalid venue ID" 
//     }),
    
//   startDateTime: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   endDateTime: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   tournamentType: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   game: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   description: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),

//   maxPlayer: z
//     .string()
//     .optional()
//     .transform((val) => {
//       if (!val || val === "" || val === "undefined") return undefined;
//       const num = parseInt(val, 10);
//       if (isNaN(num)) {
//         throw new Error("Maxplayer must be a valid number");
//       }
//       return num;
//     })
//     .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
//       message: "Maxplayer must be a positive integer"
//     }),

//   entryFee: z
//     .string()
//     .transform((val) => {
//       try{

//         if (!val || val === "" || val === "undefined" || val === "null") return 0;
//       const num = parseFloat(val);
//       if (isNaN(num)) {
//         throw new Error("Entry fee must be a valid number");
//       }
//       return num;

//       } catch(error){
//         throw new Error("Entry fee is required");
//       }
      
//     })
//     .refine((value) => value >= 0, {
//       message: "Entry fee must be a non-negative number",
//     }),

//   ratingSystem: z
//     .string()
//     .refine((val) => val !== "null" && val !== null && val !== "", { 
//       message: "This field is required" 
//     }),
    
//   winnersRace: z
//     .string()
//     .optional()
//     .transform((val) => {
//       if (!val || val === "" || val === "undefined") return undefined;
//       const num = parseInt(val, 10);
//       if (isNaN(num)) {
//         throw new Error("Winners race must be a valid number");
//       }
//       return num;
//     })
//     .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
//       message: "Winners race must be a positive integer"
//     }),

//   losersRace: z
//     .string()
//     .optional()
//     .transform((val) => {
//       if (!val || val === "" || val === "undefined") return undefined;
//       const num = parseInt(val, 10);
//       if (isNaN(num)) {
//         throw new Error("Losers race must be a valid number");
//       }
//       return num;
//     })
//     .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
//       message: "Losers race must be a positive integer"
//     }),

//   // Published field: handle string "true"/"false" from FormData
//   published: z
//     .string()
//     .transform((val) => {
//       if (val === "true") return true;
//       if (val === "false") return false;
//       if (val === "" || val === "undefined") return true; // default value
//       throw new Error("Published must be a boolean or a string 'true'/'false'");
//     })
//     .default(true),
// });

module.exports = {
    tournamentSchema,
    tournamentEditSignupSchema,
    tournamentParticipantStatusBulkUpdateSchema,
    tournamentParticipantPaidStatusBulkUpdateSchema,
    addPlayerToTournamentSchema,
    addMultiplePlayersToTournamentSchema
}