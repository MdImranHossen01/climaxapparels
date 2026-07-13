import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';

import authConfig from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password.');
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user || !user.password) {
          throw new Error('No user found with this email on this store.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. First, apply base logic from authConfig
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
        token.image = user.image || token.picture;
      }

      // 2. Add DB-specific logic
      if (user && user.id) {
        try {
          await connectToDatabase();
          const mongoose = (await import('mongoose')).default;
          
          if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
            const dbUser = await User.findById(user.id);
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role ?? 'user';
              token.phone = dbUser.phone;
              token.image = dbUser.image || user.image || token.picture;
            }
          }
        } catch (error) {
          console.error("JWT DB Enhancement Error:", error);
        }
      }

      if (trigger === 'update') {
        if (session?.name !== undefined) token.name = session.name;
        if (session?.image !== undefined) token.image = session.image;
      }
      
      if (token.email === 'imranshuvo101@gmail.com') {
        token.role = 'super_admin';
      }
      
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        
        try {
          const savedUser = await User.findOneAndUpdate(
            { email: user.email },
            { 
              $set: {
                name: user.name || 'Unknown',
                image: user.image || '',
                googleId: account.providerAccountId,
              },
              $setOnInsert: {
                role: 'user',
                status: 'active',
              }
            },
            { upsert: true, new: true }
          );

          if (savedUser) {
            user.id = savedUser._id.toString();
            if (user.email === 'imranshuvo101@gmail.com') {
              (user as any).role = 'super_admin';
            }
          }
          return true;
        } catch (error) {
          console.error('Error in Google signIn:', error);
          return true;
        }
      }
      return true;
    },
  },
});
