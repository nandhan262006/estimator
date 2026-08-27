import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) return null;
        if (credentials.password !== adminPassword) return null;
        return { id: "1", name: "Admin User", role: "admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as { role?: string; id?: string };
      if (user) { t.role = (user as { role?: string }).role; t.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      const u = session.user as { role?: string; id?: string };
      const t = token as { role?: string; id?: string };
      if (u) { u.role = t.role ?? ""; u.id = t.id ?? ""; }
      return session;
    },
  },
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  trustHost: true,
});
