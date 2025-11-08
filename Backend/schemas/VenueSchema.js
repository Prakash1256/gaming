// const { z } = require("zod");


// const createVenueSchema = z.object({
//   name: z.string().min(1, "Name is required"),
//   address: z.string().min(1, "Address is required"),
//   city: z.string().min(1, "City is required"),
//   zip: z.string().min(1, "Zip code is required"),
//   timeZone: z.string().optional().nullable(),
//   state: z.string("State is required"),
//   status: z.enum(["available", "partially booked", "completely booked"]).default("available"),
//   latitude: z.number(),
//   longitude: z.number()
// });

// const CreateTableSchema = z.object({
//   name:z.string().trim().min(3),
//   venueId: z.string().trim().min(3),
//   label: z.string("Label is Required").trim().min(3, "Label is Required"),
//   size: z.number("Size is required").max(10, "Size should be at max 10 foot"),
//   make: z.enum(["Diamond", "Brunswick", "Valley", "Other"]),
//   streamingUrl: z.string().optional(),
// });

// const updateTableSchema = z.object({
//   name:z.string().trim().min(3),
//   label: z.string("Label is Required").trim().min(3, "Label is Required"),
//   size: z.number("Size is required").max(10, "Size should be at max 10 foot"),
//   make: z.enum(["Diamond", "Brunswick", "Valley", "Other"]),
//   streamingUrl: z.string().optional(),
// });

// module.exports = {
//   createVenueSchema,
//   CreateTableSchema,
//   updateTableSchema,
// };


const { z } = require("zod");


const createVenueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zip: z.string().min(1, "Zip code is required"),
  timeZone: z.string(),
  state: z.string("State is required"),
  status: z.enum(["available", "partially booked", "completely booked"]).default("available"),
  latitude: z.number(),
  longitude: z.number()
});

const CreateTableSchema = z.object({
  name:z.string().trim().min(3),
  venueId: z.string().trim().min(3),
  // label: z.string("Label is Required").trim().min(0, "Label is Required"),
  label: z.string().trim(),

  // size: z.number("Size is required").max(10, "Size should be at max 10 foot"),
  size: z.enum(["7 Foot", "8 Foot", "9 Foot", "Big Foot"]),
  make: z.enum(["Diamond", "Brunswick", "Valley", "Other"]),
  streamingUrl: z.string().optional(),
});

const updateTableSchema = z.object({
  name:z.string().trim().min(3),
  // label: z.string("Label is Required").trim().min(0, "Label is Required"),
  label: z.string().trim(),

  // size: z.number("Size is required").max(10, "Size should be at max 10 foot"),
  size: z.enum(["7 Foot", "8 Foot", "9 Foot", "Big Foot"]),
  make: z.enum(["Diamond", "Brunswick", "Valley", "Other"]),
  streamingUrl: z.string().optional(),
});

module.exports = {
  createVenueSchema,
  CreateTableSchema,
  updateTableSchema,
};