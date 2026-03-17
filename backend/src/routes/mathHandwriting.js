import express from 'express';
import axios from 'axios';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.post('/recognize', async (req, res) => {
  const { imageDataUrl, locale = 'ru' } = req.body || {};

  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'imageDataUrl is required',
    });
  }

  if (!process.env.MATHPIX_APP_ID || !process.env.MATHPIX_APP_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Math OCR provider is not configured',
    });
  }

  try {
    const response = await axios.post(
      'https://api.mathpix.com/v3/text',
      {
        src: imageDataUrl,
        formats: ['text'],
        data_options: {
          include_latex: true,
        },
        math_inline_delimiters: ['$', '$'],
        rm_spaces: true,
        auto_rotate_confidence_threshold: 0.8,
        confidence_threshold: 0.45,
        idiomatic_eqn_arrays: true,
        include_line_data: false,
        enable_tables_fallback: false,
        locale,
      },
      {
        headers: {
          app_id: process.env.MATHPIX_APP_ID,
          app_key: process.env.MATHPIX_APP_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    const payload = response.data || {};

    return res.json({
      success: true,
      data: {
        latex: payload.latex_styled || payload.latex_normalized || payload.text || '',
        text: payload.text || '',
        confidence: payload.confidence ?? null,
        provider: 'mathpix',
      },
    });
  } catch (error) {
    const providerMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Math OCR request failed';

    return res.status(502).json({
      success: false,
      message: providerMessage,
    });
  }
});

export default router;
