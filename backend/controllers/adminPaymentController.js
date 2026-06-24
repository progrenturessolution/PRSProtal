const AdminPayment = require('../models/AdminPayment');

// Get all payments
const getPayments = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const payments = await AdminPayment.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error in getPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments'
    });
  }
};

// Create a payment record
const createPayment = async (req, res) => {
  try {
    const { name, role, paymentGoal, payment, receiveDate, sendDate } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name and Role are required'
      });
    }

    const goalNum = Number(paymentGoal) || 0;
    const payNum = Number(payment) || 0;
    const pendingNum = goalNum - payNum;

    const newPayment = new AdminPayment({
      name,
      role,
      paymentGoal: goalNum,
      payment: payNum,
      pendingPayment: pendingNum,
      receiveDate: receiveDate || null,
      sendDate: sendDate || null
    });

    await newPayment.save();

    res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      payment: newPayment
    });
  } catch (error) {
    console.error('Error in createPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment'
    });
  }
};

// Update a payment record
const updatePayment = async (req, res) => {
  try {
    const { name, role, paymentGoal, payment, receiveDate, sendDate } = req.body;
    const { id } = req.params;

    const paymentRecord = await AdminPayment.findById(id);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (name) paymentRecord.name = name;
    if (role) paymentRecord.role = role;
    
    if (paymentGoal !== undefined) paymentRecord.paymentGoal = Number(paymentGoal) || 0;
    if (payment !== undefined) paymentRecord.payment = Number(payment) || 0;
    
    // Recalculate pending
    paymentRecord.pendingPayment = paymentRecord.paymentGoal - paymentRecord.payment;
    
    if (receiveDate !== undefined) paymentRecord.receiveDate = receiveDate || null;
    if (sendDate !== undefined) paymentRecord.sendDate = sendDate || null;

    await paymentRecord.save();

    res.status(200).json({
      success: true,
      message: 'Payment record updated successfully',
      payment: paymentRecord
    });
  } catch (error) {
    console.error('Error in updatePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment'
    });
  }
};

// Delete a payment record
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentRecord = await AdminPayment.findById(id);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    await AdminPayment.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting payment'
    });
  }
};

module.exports = {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment
};
