import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import { compareSync } from "bcrypt-ts-edge";
// import { cookies } from "next/headers";
import { authConfig } from "./auth.config";

export const config = {
  pages: {
    signIn: "/signIn",
    error: "signIn",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, //30days
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials === null) return null;
        //find user in db
        const user = await prisma.user.findFirst({
          where: { email: credentials.email as string },
        });
        //check if user exist and if the password matches
        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password
          );
          // if pass is correct return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // if doesnt exist or pass doesnt match then return null
        return null;
      },
    }),
  ],
  ...authConfig.callbacks,
  // callbacks: {
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   async session({ session, user, trigger, token }: any) {
  //     //set the user id from the token
  //     session.user.id = token.sub;
  //     session.user.role = token.role;
  //     session.user.name = token.name;

  //     //if there is an update, set the user name
  //     if (trigger === "update") {
  //       session.user.name = user.name;
  //     }

  //     return session;
  //   },
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   async jwt({ token, user, trigger, session }: any) {
  //     //Assign user fields to token
  //     if (user) {
  //       token.role = user.role;
  //       // if user has no name then use the email
  //       if (user.name === "NO_EMAIL") {
  //         token.name = user.email!.split("@")[0];

  //         // Update database to reflect the token name
  //         await prisma.user.update({
  //           where: { id: user.id },
  //           data: { name: token.name },
  //         });
  //       }
  //     }
  //     return token;
  //   },
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   authorized({ request, auth }: any) {
  //     //Check for session cart cookie
  //     if (!request.cookies.get("sessionCartId")) {
  //       //generate new session cart id cookie
  //       const sessionCartId = crypto.randomUUID();
  //       console.log(sessionCartId);
  //       return true;
  //     } else {
  //       return true;
  //     }
  //   },
  // },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
