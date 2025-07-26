import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth API route. Both GET and POST requests are handled here. The
// configuration lives in `authOptions` so it can also be used by
// `getServerSession` calls throughout the app.

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
