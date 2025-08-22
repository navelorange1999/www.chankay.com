import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {getPayloadHMR} from "@payloadcms/next/utilities";
import configPromise from "@payload-config";

// GitHub profile interface
interface GitHubProfile {
	id: number;
	login: string;
	name?: string;
	email?: string;
}

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
					const payload = await getPayloadHMR({
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
		async signIn({user, account, profile}) {
			if (account?.provider === "github") {
				try {
					const payload = await getPayloadHMR({
						config: configPromise,
					});
					const githubProfile = profile as GitHubProfile;

					// Find existing user by email (primary identifier)
					const existingUsers = await payload.find({
						collection: "users",
						where: {
							email: {equals: user.email},
						},
						limit: 1,
					});

					if (existingUsers.docs.length === 0) {
						console.log(
							`Access denied: User ${user.email} not found in system`
						);
						return false; // Only allow existing users for personal blog
					}

					const existingUser = existingUsers.docs[0];

					// Check if GitHub account is already connected
					const githubAccount = existingUser?.accounts?.find(
						(acc) =>
							acc.provider === "github" &&
							acc.providerAccountId ===
								githubProfile.id.toString()
					);

					if (!githubAccount) {
						// Connect GitHub account to existing user
						const updatedAccounts = [
							...(existingUser?.accounts || []),
							{
								provider: "github" as const,
								providerAccountId: githubProfile.id.toString(),
								providerUsername: githubProfile.login,
								connectedAt: new Date().toISOString(),
							},
						];

						if (existingUser) {
							await payload.update({
								collection: "users",
								id: existingUser.id,
								data: {
									accounts: updatedAccounts,
									provider: "github" as const, // Update primary provider
								},
							});
						}

						console.log(
							`GitHub account connected to user: ${user.email}`
						);
					} else {
						// Update GitHub username if changed
						if (
							githubAccount.providerUsername !==
								githubProfile.login &&
							existingUser
						) {
							const updatedAccounts = existingUser.accounts?.map(
								(acc) =>
									acc.provider === "github" &&
									acc.providerAccountId ===
										githubProfile.id.toString()
										? {
												...acc,
												providerUsername:
													githubProfile.login,
											}
										: acc
							);

							await payload.update({
								collection: "users",
								id: existingUser.id,
								data: {accounts: updatedAccounts},
							});

							console.log(
								`GitHub username updated for user: ${user.email}`
							);
						}
					}

					return true;
				} catch (error) {
					console.error("Error during GitHub sign in:", error);
					return false;
				}
			}
			return true;
		},
		async jwt({token, account, profile}) {
			if (account?.provider === "github") {
				const githubProfile = profile as GitHubProfile;
				token.githubId = githubProfile.id.toString();
				token.provider = "github" as const;
			}
			return token;
		},
		async session({session, token}) {
			return {
				...session,
				user: {
					...session.user,
					githubId: token.githubId as string,
					provider: token.provider as string,
				},
			};
		},
	},
	pages: {
		signIn: "/auth/login",
	},
});

export {handler as GET, handler as POST};
