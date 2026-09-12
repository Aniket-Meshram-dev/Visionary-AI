import crypto from 'crypto';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { updateUserPlan } from '../middlewares/auth.js';
import { supabaseAdmin } from '../configs/supabase.js';

// Lazy initialize payment providers to avoid startup crashes if keys are not yet filled
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Public payment gateway status and public keys
 */
export const getPaymentConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      stripe: {
        enabled: Boolean(process.env.STRIPE_SECRET_KEY),
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      },
      razorpay: {
        enabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        keyId: process.env.RAZORPAY_KEY_ID || '',
      },
      promoEnabled: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stripe: Create Checkout Session (USD)
 */
export const createStripeSession = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured on this server. Please contact support.',
      });
    }

    const userId = req.userId;
    const userEmail = req.user?.email || '';
    const { billingCycle = 'monthly' } = req.body;

    const isAnnual = billingCycle === 'annual';
    const amountInCents = isAnnual ? 18000 : 1900; // $180/yr ($15/mo) or $19/mo

    const origin = req.headers.origin || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      ...(userEmail ? { customer_email: userEmail } : {}),
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Visionary.ai Pro Plan (${isAnnual ? 'Annual' : 'Monthly'})`,
              description: 'Unlimited AI generations across all 7 creator tools',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        billingCycle,
        plan: 'premium',
      },
      success_url: process.env.STRIPE_SUCCESS_URL || `${origin}/ai?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${origin}/#pro-plan?payment=cancelled`,
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe create session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stripe: Verify checkout session and upgrade plan
 */
export const verifyStripePayment = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Stripe not configured' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed or verified.',
      });
    }

    const targetUserId = session.client_reference_id || session.metadata?.userId || req.userId;
    if (targetUserId !== req.userId) {
      return res.status(403).json({ success: false, message: 'User mismatch on payment session.' });
    }

    await updateUserPlan(targetUserId, 'premium');

    res.json({
      success: true,
      message: 'Payment verified! Upgraded to Pro Plan successfully.',
    });
  } catch (error) {
    console.error('Stripe verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Razorpay: Create Order (INR)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured on this server. Please contact support.',
      });
    }

    const { billingCycle = 'monthly' } = req.body;
    const isAnnual = billingCycle === 'annual';
    // Price in paise: ₹1,499/mo (149900 paise) or ₹14,999/yr (1499900 paise)
    const amountInPaise = isAnnual ? 1499900 : 149900;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${req.userId.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
      notes: {
        userId: req.userId,
        billingCycle,
        plan: 'premium',
      },
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Razorpay: Verify signature and upgrade plan
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete Razorpay payment verification parameters.',
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: 'Razorpay secret key not configured.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // Upgrade user
    await updateUserPlan(req.userId, 'premium');

    res.json({
      success: true,
      message: 'Razorpay payment verified! Welcome to Visionary.ai Pro.',
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stripe Webhook Handler
 * Verifies webhook signature and automatically upgrades user plan upon asynchronous payment success
 */
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Stripe not initialized' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (endpointSecret) {
      if (!sig) {
        return res.status(400).send('Webhook Error: Missing stripe-signature header.');
      }
      if (!req.rawBody) {
        return res.status(400).send('Webhook Error: Missing raw request body for signature verification.');
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } else {
      console.warn('[Stripe Webhook] WARNING: STRIPE_WEBHOOK_SECRET is not configured. Unverified payloads are active.');
      event = req.body;
    }
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (userId) {
          await updateUserPlan(userId, 'premium');
          console.log(`[Stripe Webhook] Successfully upgraded user ${userId} to Pro plan.`);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.userId;
        if (userId) {
          await updateUserPlan(userId, 'premium');
          console.log(`[Stripe Webhook] PaymentIntent succeeded for user ${userId}. Upgraded to Pro.`);
        }
        break;
      }
      default:
        console.log(`[Stripe Webhook] Received unhandled event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Error processing event:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Razorpay Webhook Handler
 * Verifies HMAC-SHA256 signature and automatically upgrades user plan upon payment capture
 */
export const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  try {
    if (webhookSecret) {
      if (!signature) {
        return res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header.' });
      }
      const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      const signatureBuffer = Buffer.from(signature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        console.error('[Razorpay Webhook] Invalid webhook signature');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    } else {
      console.warn('[Razorpay Webhook] WARNING: RAZORPAY_WEBHOOK_SECRET is not configured.');
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const entity = payload?.payment?.entity || payload?.order?.entity;
      const userId = entity?.notes?.userId;
      if (userId) {
        await updateUserPlan(userId, 'premium');
        console.log(`[Razorpay Webhook] Upgraded user ${userId} to Pro on ${event}.`);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook] Error processing event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
