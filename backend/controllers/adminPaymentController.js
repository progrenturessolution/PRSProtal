const AdminPayment = require('../models/AdminPayment');
const PaymentNote = require('../models/PaymentNote');

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

    const payments = await AdminPayment.find(query).sort({ updatedAt: -1 });
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
    const {
      name,
      role,
      paymentGoal,
      connectedBy,
      paymentType,
      totalPayment,
      firstPayment,
      firstPaymentSendDate,
      firstPaymentReceiveDate,
      secondPayment,
      secondPaymentSendDate,
      secondPaymentReceiveDate,
      finalPayment,
      finalPaymentSendDate,
      finalPaymentReceiveDate
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name and Role are required'
      });
    }

    const totPay = Number(totalPayment) || 0;
    const fPay = Number(firstPayment) || 0;
    const sPay = Number(secondPayment) || 0;
    const lPay = Number(finalPayment) || 0;
    const paidSum = fPay + sPay + lPay;
    const pendPay = totPay - paidSum;

    const newPayment = new AdminPayment({
      name,
      role,
      paymentGoal: paymentGoal || 'Pending',
      payment: paidSum,
      pendingPayment: pendPay,
      receiveDate: firstPaymentReceiveDate || null,
      sendDate: firstPaymentSendDate || null,
      connectedBy: connectedBy || '',
      paymentType: paymentType || 'Receive',
      totalPayment: totPay,
      firstPayment: fPay,
      firstPaymentSendDate: firstPaymentSendDate || null,
      firstPaymentReceiveDate: firstPaymentReceiveDate || null,
      secondPayment: sPay,
      secondPaymentSendDate: secondPaymentSendDate || null,
      secondPaymentReceiveDate: secondPaymentReceiveDate || null,
      finalPayment: lPay,
      finalPaymentSendDate: finalPaymentSendDate || null,
      finalPaymentReceiveDate: finalPaymentReceiveDate || null
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
    const {
      name,
      role,
      paymentGoal,
      connectedBy,
      paymentType,
      totalPayment,
      firstPayment,
      firstPaymentSendDate,
      firstPaymentReceiveDate,
      secondPayment,
      secondPaymentSendDate,
      secondPaymentReceiveDate,
      finalPayment,
      finalPaymentSendDate,
      finalPaymentReceiveDate
    } = req.body;
    const { id } = req.params;

    const paymentRecord = await AdminPayment.findById(id);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (name !== undefined) paymentRecord.name = name;
    if (role !== undefined) paymentRecord.role = role;
    if (paymentGoal !== undefined) paymentRecord.paymentGoal = paymentGoal;
    if (connectedBy !== undefined) paymentRecord.connectedBy = connectedBy;
    if (paymentType !== undefined) paymentRecord.paymentType = paymentType;

    if (totalPayment !== undefined) paymentRecord.totalPayment = Number(totalPayment) || 0;
    if (firstPayment !== undefined) paymentRecord.firstPayment = Number(firstPayment) || 0;
    if (secondPayment !== undefined) paymentRecord.secondPayment = Number(secondPayment) || 0;
    if (finalPayment !== undefined) paymentRecord.finalPayment = Number(finalPayment) || 0;

    if (firstPaymentSendDate !== undefined) paymentRecord.firstPaymentSendDate = firstPaymentSendDate || null;
    if (firstPaymentReceiveDate !== undefined) paymentRecord.firstPaymentReceiveDate = firstPaymentReceiveDate || null;
    if (secondPaymentSendDate !== undefined) paymentRecord.secondPaymentSendDate = secondPaymentSendDate || null;
    if (secondPaymentReceiveDate !== undefined) paymentRecord.secondPaymentReceiveDate = secondPaymentReceiveDate || null;
    if (finalPaymentSendDate !== undefined) paymentRecord.finalPaymentSendDate = finalPaymentSendDate || null;
    if (finalPaymentReceiveDate !== undefined) paymentRecord.finalPaymentReceiveDate = finalPaymentReceiveDate || null;

    // Recalculate computed payment and pendingPayment values
    const fPayVal = paymentRecord.firstPayment || 0;
    const sPayVal = paymentRecord.secondPayment || 0;
    const lPayVal = paymentRecord.finalPayment || 0;
    paymentRecord.payment = fPayVal + sPayVal + lPayVal;
    paymentRecord.pendingPayment = (paymentRecord.totalPayment || 0) - paymentRecord.payment;

    // Backward-compatible receiveDate / sendDate fallback matching 1st payment
    paymentRecord.receiveDate = paymentRecord.firstPaymentReceiveDate || null;
    paymentRecord.sendDate = paymentRecord.firstPaymentSendDate || null;

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

// Get all payment notes
const getPaymentNotes = async (req, res) => {
  try {
    const notes = await PaymentNote.find({}).sort({ isPinned: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Error in getPaymentNotes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment notes'
    });
  }
};

// Create a payment note
const createPaymentNote = async (req, res) => {
  try {
    const { title, text, color, textColor, borderColor, isPinned } = req.body;

    const newNote = new PaymentNote({
      title: title || 'Untitled Note',
      text: text || '',
      color: color || '#324158',
      textColor: textColor || '#ffffff',
      borderColor: borderColor || '#1f293b',
      isPinned: isPinned || false
    });

    await newNote.save();

    res.status(201).json({
      success: true,
      message: 'Payment note created successfully',
      note: newNote
    });
  } catch (error) {
    console.error('Error in createPaymentNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment note'
    });
  }
};

// Update a payment note
const updatePaymentNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, text, color, textColor, borderColor, isPinned } = req.body;

    const note = await PaymentNote.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Payment note not found'
      });
    }

    if (title !== undefined) note.title = title;
    if (text !== undefined) note.text = text;
    if (color !== undefined) note.color = color;
    if (textColor !== undefined) note.textColor = textColor;
    if (borderColor !== undefined) note.borderColor = borderColor;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Payment note updated successfully',
      note
    });
  } catch (error) {
    console.error('Error in updatePaymentNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment note'
    });
  }
};

// Delete a payment note
const deletePaymentNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await PaymentNote.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Payment note not found'
      });
    }

    await PaymentNote.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Payment note deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePaymentNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting payment note'
    });
  }
};

module.exports = {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentNotes,
  createPaymentNote,
  updatePaymentNote,
  deletePaymentNote
};
