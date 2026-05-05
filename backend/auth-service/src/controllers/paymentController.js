const Razorpay = require('razorpay');
const crypto = require('crypto');
const College = require('../models/College');

// Make sure to load environment variables for razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

exports.createOrder = async (req, res) => {
  try {
    const { collegeId } = req.user;
    
    if (!collegeId) {
      return res.status(400).json({ success: false, message: 'User does not belong to a college' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    // Example fixed amount for subscription: 499 INR (represented in paise)
    const amount = 499 * 100;
    
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${collegeId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    college.razorpayOrderId = order.id;
    await college.save();

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { collegeId } = req.user;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const college = await College.findById(collegeId);
      if (college) {
        college.paymentStatus = 'COMPLETED';
        college.razorpayPaymentId = razorpay_payment_id;
        // Optionally auto-approve or keep pending for admin approval
        // Admin flow says: "approve after checking payment", so maybe just set status.
        await college.save();
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying razorpay payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};
