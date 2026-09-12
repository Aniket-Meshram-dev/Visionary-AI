import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getPaymentConfig,
  createStripeSession,
  verifyStripePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  stripeWebhook,
  razorpayWebhook,
} from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.get('/config', getPaymentConfig);
paymentRouter.post('/stripe/create-session', auth, createStripeSession);
paymentRouter.post('/stripe/verify-payment', auth, verifyStripePayment);
paymentRouter.post('/stripe/webhook', stripeWebhook);
paymentRouter.post('/razorpay/create-order', auth, createRazorpayOrder);
paymentRouter.post('/razorpay/verify-payment', auth, verifyRazorpayPayment);
paymentRouter.post('/razorpay/webhook', razorpayWebhook);

export default paymentRouter;
