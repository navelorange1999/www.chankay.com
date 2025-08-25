import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {getPayload} from "payload";
import configPromise from "@payload-config";

const handler = NextAuth({
	providers: [
		GitHubProvider({
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: {label: "Email", type: "email"},
				password: {label: "Password", type: "password"},
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const payload = await getPayload({
						config: configPromise,
					});

					const result = await payload.login({
						collection: "users",
						data: {
							email: credentials.email,
							password: credentials.password,
						},
					});

					if (result.user) {
						return {
							id: result.user.id,
							email: result.user.email,
							name: result.user.name,
						};
					}

					return null;
				} catch (error) {
					console.error("Credentials authentication error:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async signIn({user, account}) {
			if (account?.provider && account.provider !== "credentials") {
				try {
					const payload = await getPayload({
						config: configPromise,
					});
					// Find user by OAuth account or email
					const existingUsers = await payload.find({
						collection: "users",
						where: {
							or: [
								{
									"accounts.provider": {
										equals: account?.provider,
									},
									"accounts.providerAccountId": {
										equals: account?.providerAccountId,
									},
								},
								{
									email: {equals: user.email},
								},
							],
						},
						limit: 1,
					});

					if (existingUsers.docs.length === 0) {
						console.log(
							`Access denied: No user found for ${account?.provider} account or email ${user.email}`
						);
						return false;
					}

					return true;
				} catch (error) {
					console.error(
						`Error during ${account?.provider} sign in:`,
						error
					);
					return false;
				}
			}
			return true;
		},
		async jwt({token, account}) {
			if (account) {
				token.provider = account.provider;
				token.providerAccountId = account.providerAccountId;
			}
			return token;
		},
		async session({session, token}) {
			return {
				...session,
				user: {
					...session.user,
					provider: token.provider as string,
				},
			};
		},
	},
	pages: {
		signIn: "/auth/login",
		signOut: "/auth/login",
		error: "/auth/login",
	},
});

export {handler as GET, handler as POST};
