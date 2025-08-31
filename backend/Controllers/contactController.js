import Contact from '../Model/Contact.js';

// POST - Create new contact message
export const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    const newContact = new Contact({
      name,
      email,
      message
    });

    const savedContact = await newContact.save();
    
    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      data: savedContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending contact message',
      error: error.message
    });
  }
};

// GET - Get all contact messages
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact messages',
      error: error.message
    });
  }
};

// GET - Get single contact message by ID
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact message',
      error: error.message
    });
  }
};

// DELETE - Delete contact message by ID
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findByIdAndDelete(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact message',
      error: error.message
    });
  }
}; 