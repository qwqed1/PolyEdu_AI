import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

export const authController = {
  async register(req, res) {
    try {
      const { full_name, email, password, institution, position, role } = req.body;

      const normalizedRole = role === 'student' ? 'student' : role === 'teacher' ? 'teacher' : null;
      if (!normalizedRole) {
        return res.status(400).json({ message: 'Invalid role. Use student or teacher.' });
      }

      if (normalizedRole === 'student' && !position) {
        return res.status(400).json({ message: 'Student group is required' });
      }

      if (normalizedRole === 'teacher' && !position) {
        return res.status(400).json({ message: 'Teacher position is required' });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const user = await UserModel.create({
        full_name,
        email,
        password_hash,
        institution,
        position,
        role: normalizedRole,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async login(req, res) {
    try {
      const { email, password, role } = req.body;

      const normalizedRole = role === 'student' ? 'student' : role === 'teacher' ? 'teacher' : null;
      if (!normalizedRole) {
        return res.status(400).json({ message: 'Invalid role. Use student or teacher.' });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.role !== normalizedRole) {
        return res.status(401).json({ message: 'Вы выбрали неверную роль для этого аккаунта' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, role: user.role || 'teacher' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Remove password from response
      delete user.password_hash;

      res.json({
        token,
        user,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async me(req, res) {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};
