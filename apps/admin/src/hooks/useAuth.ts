import { useState } from "react"
import { signIn } from "next-auth/react"

interface UseAuthReturn {
	login: (email: string, password: string) => Promise<void>
	loginWithGitHub: () => void
	isLoading: boolean
	error: string | null
	clearError: () => void
}

export function useAuth(): UseAuthReturn {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const login = async (email: string, password: string) => {
		setIsLoading(true)
		setError(null)

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			})

			if (result?.ok) {
				window.location.href = "/"
			} else {
				setError(result?.error || "Login failed")
			}
		} catch (error) {
			setError("An error occurred during login")
		} finally {
			setIsLoading(false)
		}
	}

	const loginWithGitHub = () => {
		signIn("github", { callbackUrl: "/" })
	}

	const clearError = () => {
		setError(null)
	}

	return {
		login,
		loginWithGitHub,
		isLoading,
		error,
		clearError,
	}
}
