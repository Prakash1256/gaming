// // // const mongoose = require('mongoose');

// // // const SupportTicketSchema = new mongoose.Schema({
// // //   subject: {
// // //     type: String,
// // //     required: true,
// // //     trim: true,
// // //   },
// // //   description: {
// // //     type: String,
// // //     required: true,
// // //   },
// // //   status: {
// // //     type: String,
// // //     enum: ['open', 'in_progress', 'resolved', 'closed'],
// // //     default: 'open',
// // //   },
// // //   priority: {
// // //     type: String,
// // //     enum: ['low', 'medium', 'high', 'urgent'],
// // //     default: 'medium',
// // //   },
// // //   user: {
// // //     type: mongoose.Schema.Types.ObjectId,
// // //     ref: 'User',
// // //     required: true,
// // //   },
// // //   assignedTo: {
// // //     type: mongoose.Schema.Types.ObjectId,
// // //     ref: 'User', // could be a support agent or admin
// // //   },
// // //   comments: [{
// // //     author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// // //     message: { type: String, required: true },
// // //     createdAt: { type: Date, default: Date.now }
// // //   }],
// // //   isArchived: {
// // //     type: Boolean,
// // //     default: false
// // //   }
// // // }, {
// // //   timestamps: true // adds createdAt and updatedAt fields automatically
// // // });

// // // module.exports = mongoose.model('SupportTicket', SupportTicketSchema);


// // // models/supportTicket.model.js
// // const mongoose = require('mongoose');

// // const supportTicketSchema = new mongoose.Schema({
// //   user: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User',
// //     required: true
// //   },
// //   subject: {
// //     type: String,
// //     required: true
// //   },
// //   message: {
// //     type: String,
// //     required: true
// //   },
// //   status: {
// //     type: String,
// //     enum: ['open', 'in-progress', 'resolved', 'closed'],
// //     default: 'open'
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now
// //   },
// //   updatedAt: {
// //     type: Date,
// //     default: Date.now
// //   },
// //   responses: [{
// //     message: String,
// //     responder: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User'
// //     },
// //     createdAt: {
// //       type: Date,
// //       default: Date.now
// //     }
// //   }]
// // }, {
// //   timestamps: true
// // });

// // module.exports = mongoose.model('SupportTicket', supportTicketSchema);


// const mongoose = require('mongoose');

// const supportTicketSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   subject: {
//     type: String,
//     required: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['open', 'in-progress', 'resolved', 'closed'],
//     default: 'open'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   },
//   responses: [{
//     message: String,
//     responder: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now
//     }
//   }]
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('SupportTicket', supportTicketSchema);


const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'open', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  responses: [{
    message: String,
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {  // Add status to each response
      type: String,
      enum: ['pending', 'open', 'closed'],
      default: 'open'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);