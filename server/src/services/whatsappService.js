const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const resumeRepository = require('../repositories/resumeRepository');

// In-memory registry of active WhatsApp clients per user
const sessions = new Map();

/**
 * Normalizes phone numbers to standard international digits without symbols
 * e.g. "+91 98765-43210" -> "919876543210"
 * Also auto-detects 10-digit mobile numbers (e.g. India) and prepends country code 91
 */
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  // If starts with 0 and 11 digits (e.g. 09529837131), strip leading 0
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  // If 10 digits starting with 6, 7, 8, or 9 (standard Indian mobile format without +91)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Initializes or retrieves a WhatsApp client session for a specific user
 */
async function initializeClient(userId) {
  const existing = sessions.get(userId);
  if (existing && existing.client) {
    return {
      status: existing.status,
      qrDataUrl: existing.qrDataUrl,
      phone: existing.phone,
      info: existing.info
    };
  }

  const sessionObj = {
    client: null,
    status: 'initializing', // 'initializing' | 'qr_ready' | 'connected' | 'disconnected' | 'error'
    qrDataUrl: null,
    phone: null,
    info: null,
    lastError: null
  };
  sessions.set(userId, sessionObj);

  const authPath = path.join(__dirname, '../../.wwebjs_auth');
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `user_${userId}`,
      dataPath: authPath
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    }
  });

  sessionObj.client = client;

  client.on('qr', async (qr) => {
    try {
      const qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 6 });
      sessionObj.status = 'qr_ready';
      sessionObj.qrDataUrl = qrDataUrl;
    } catch (err) {
      console.error(`[WhatsApp user_${userId}] QR generation error:`, err);
    }
  });

  client.on('ready', async () => {
    const phone = client.info?.wid?.user || 'Connected';
    sessionObj.status = 'connected';
    sessionObj.qrDataUrl = null;
    sessionObj.phone = phone;
    sessionObj.info = {
      name: client.info?.pushname || 'WhatsApp User',
      phone
    };

    try {
      await pool.execute(
        'UPDATE user_settings SET whatsapp_connected = 1, whatsapp_phone = ? WHERE user_id = ?',
        [phone, userId]
      );
    } catch (dbErr) {
      console.error(`[WhatsApp user_${userId}] DB update error:`, dbErr.message);
    }
  });

  client.on('authenticated', () => {
    sessionObj.status = 'authenticated';
  });

  client.on('auth_failure', (msg) => {
    sessionObj.status = 'error';
    sessionObj.lastError = msg || 'Authentication failed';
  });

  client.on('disconnected', async (reason) => {
    sessionObj.status = 'disconnected';
    sessionObj.qrDataUrl = null;
    sessionObj.phone = null;
    try {
      await pool.execute(
        'UPDATE user_settings SET whatsapp_connected = 0 WHERE user_id = ?',
        [userId]
      );
    } catch (e) {
      // ignore
    }
  });

  // Start initialization
  client.initialize().catch((err) => {
    console.error(`[WhatsApp user_${userId}] Initialization error:`, err);
    sessionObj.status = 'error';
    sessionObj.lastError = err.message;
  });

  return {
    status: sessionObj.status,
    qrDataUrl: sessionObj.qrDataUrl,
    phone: sessionObj.phone,
    info: sessionObj.info
  };
}

/**
 * Gets session status or QR code for user
 */
async function getStatus(userId) {
  const session = sessions.get(userId);
  if (!session) {
    // Check DB status
    const [rows] = await pool.execute(
      'SELECT whatsapp_connected, whatsapp_phone FROM user_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const dbConnected = rows[0]?.whatsapp_connected === 1;
    return {
      connected: dbConnected,
      status: dbConnected ? 'connected' : 'disconnected',
      phone: rows[0]?.whatsapp_phone || null,
      qrDataUrl: null
    };
  }

  return {
    connected: session.status === 'connected',
    status: session.status,
    phone: session.phone,
    qrDataUrl: session.qrDataUrl,
    lastError: session.lastError
  };
}

/**
 * Disconnects and destroys user WhatsApp session
 */
async function disconnect(userId) {
  const session = sessions.get(userId);
  if (session && session.client) {
    try {
      await session.client.logout();
    } catch (e) {
      try {
        await session.client.destroy();
      } catch (err) {
        // ignore
      }
    }
  }
  sessions.delete(userId);

  await pool.execute(
    'UPDATE user_settings SET whatsapp_connected = 0, whatsapp_phone = NULL WHERE user_id = ?',
    [userId]
  );

  return { success: true, message: 'WhatsApp session disconnected successfully' };
}

/**
 * Sends a direct message & optional PDF resume attachment to a single phone number
 */
async function sendDirectMessage({ userId, phone, message, resumeId = null }) {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned || cleaned.length < 7) {
    throw new Error(`Invalid phone number "${phone}". Please include country code without symbols (e.g. 919876543210).`);
  }

  const session = sessions.get(userId);
  if (!session || !session.client || session.status !== 'connected') {
    throw new Error('Your WhatsApp is not connected. Please scan the QR code in Settings first.');
  }

  let chatId = `${cleaned}@c.us`;
  try {
    if (typeof session.client.getNumberId === 'function') {
      const numberDetails = await session.client.getNumberId(cleaned);
      if (numberDetails && numberDetails._serialized) {
        chatId = numberDetails._serialized;
      } else {
        throw new Error(`The phone number "${phone}" is not registered on WhatsApp. Please check the number and include the country code (e.g. 91 for India, 1 for US).`);
      }
    }
  } catch (lookupErr) {
    if (lookupErr.message && lookupErr.message.includes('not registered')) {
      throw lookupErr;
    }
    // Fallback if network or API lookup variance
    chatId = `${cleaned}@c.us`;
  }

  let responseInfo = null;

  // If a resume ID is provided, attach the PDF
  if (resumeId) {
    const resume = await resumeRepository.findById(userId, resumeId);
    if (resume && fs.existsSync(resume.storage_path)) {
      const fileData = fs.readFileSync(resume.storage_path);
      const base64 = fileData.toString('base64');
      const media = new MessageMedia('application/pdf', base64, resume.original_filename || 'Resume.pdf');

      try {
        responseInfo = await session.client.sendMessage(chatId, media, {
          caption: message,
          sendMediaAsDocument: true
        });
      } catch (mediaErr) {
        console.warn(`[WhatsApp] Direct media with caption failed (${mediaErr.message}), falling back to sending text + document...`);
        // Fallback: send text message first, then send document file
        await session.client.sendMessage(chatId, message);
        responseInfo = await session.client.sendMessage(chatId, media, {
          sendMediaAsDocument: true
        });
      }
      return {
        success: true,
        chatId,
        messageId: responseInfo?.id?._serialized,
        withAttachment: true
      };
    }
  }

  // Send pure text
  responseInfo = await session.client.sendMessage(chatId, message);

  return {
    success: true,
    chatId,
    messageId: responseInfo?.id?._serialized,
    withAttachment: false
  };
}

module.exports = {
  initializeClient,
  getStatus,
  disconnect,
  sendDirectMessage,
  cleanPhoneNumber
};
