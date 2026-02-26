"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

const ERROR_MESSAGES: Record<string, string> = {
	credentials_failed: "Invalid email or password.",
	github_config_missing: "GitHub OAuth is not configured correctly.",
	github_not_authorized:
		"Your GitHub account is not pre-authorized for this admin site. Contact an administrator.",
	oauth_callback_failed: "GitHub login failed during callback processing.",
	oauth_state_invalid: "GitHub login state is invalid or expired. Please try again.",
	oauth_token_exchange_failed: "Failed to exchange GitHub OAuth code for access token.",
	oauth_user_fetch_failed: "Failed to retrieve your GitHub profile.",
}

type LoginResponseData = {
	errors?: Array<{
		message?: string
	}>
	message?: string
}

export function useLoginForm() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [credentialsError, setCredentialsError] = useState<string | null | undefined>(null)
	const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false)
	const [isRedirectingToGitHub, setIsRedirectingToGitHub] = useState(false)
	const searchParams = useSearchParams()
	const errorCode = searchParams.get("error")
	const oauthErrorMessage = useMemo(() => {
		if (!errorCode) {
			return null
		}

		return ERROR_MESSAGES[errorCode] || "Authentication failed. Please try again."
	}, [errorCode])
	const errorMessage = credentialsError || oauthErrorMessage
	const isLoading = isSubmittingCredentials || isRedirectingToGitHub

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setCredentialsError(null)
		setIsSubmittingCredentials(true)

		try {
			const response = await fetch("/api/users/login", {
				body: JSON.stringify({
					email,
					password,
				}),
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			})

			if (response.ok) {
				window.location.href = "/"
				return
			}

			let message = ERROR_MESSAGES.credentials_failed

			try {
				const responseData = (await response.json()) as LoginResponseData

				if (responseData.errors?.[0]?.message) {
					message = responseData.errors[0].message || ERROR_MESSAGES.credentials_failed
				} else if (responseData.message) {
					message = responseData.message || ERROR_MESSAGES.credentials_failed
				}
			} catch {
				// Keep default message when response is not JSON.
			}

			setCredentialsError(message || ERROR_MESSAGES.credentials_failed)
		} catch {
			setCredentialsError("Login request failed. Please try again.")
		} finally {
			setIsSubmittingCredentials(false)
		}
	}

	const handleGitHubLogin = () => {
		setIsRedirectingToGitHub(true)
		window.location.href = "/api/auth/github/start"
	}

	return {
		email,
		setEmail,
		password,
		setPassword,
		errorMessage,
		isLoading,
		isSubmittingCredentials,
		isRedirectingToGitHub,
		handleSubmit,
		handleGitHubLogin,
	}
}
