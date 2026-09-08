import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export const options = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email:',
          type: 'text',
          placeholder: 'Enter your email'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error('No user found');
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error('Incorrect password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image
        };
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || 'kvwLrfri/MBznUCofIoRH9+NvGu6GqvVdqO3mor1GuA=',
  pages: {
    signIn: '/auth/login', // Template's login path
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      if (trigger === 'update' && token?.id) {
        // Fetch fresh user data from DB when update() is called
        const freshUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (freshUser) {
          token.name = freshUser.name;
          token.image = freshUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 * 1000,
  }
};