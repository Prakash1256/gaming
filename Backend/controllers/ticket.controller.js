const SupportTicket = require('../models/SupportTicket');

// Create a new support ticket
const createTicket = async (req, res) => { 

  
  try { 
    
    const ticket = new SupportTicket({
      ...req.body,
      user: req.user._id // assuming `req.user` is populated via middleware
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all tickets (with optional filters)
 const getAllTickets = async (req, res) => {
  try {
    const filters = req.query || {};
    const tickets = await SupportTicket.find(filters).populate('user assignedTo');
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single ticket by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user assignedTo comments.author');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a ticket by ID
const updateTicket = async (req, res) => {
  try {
    const updated = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a ticket by ID
const deleteTicket = async (req, res) => {
  try {
    const deleted = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


modules.exports = {
    deleteTicket,
    updateTicket,
    getTicketById,
    getAllTickets,
    createTicket
}