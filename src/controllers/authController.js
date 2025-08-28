import {
  forgetPasswordService,
  loginService,
  registerService,
  verifyOtpService,
} from "../services/authServices.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await registerService(email, password);
    res.status(201).json({ message: result.message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtpService(email, otp);
    res.json({ message: result.message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    return successResponse(res, result.message, {
      accessToken: result.accessToken,
    });
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgetPasswordService(email);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};
