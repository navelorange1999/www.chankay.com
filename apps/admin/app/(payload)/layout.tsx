import type {ReactNode} from "react";
import "./global.css";

export default function RootLayout({children}: {children: ReactNode}) {
	return (
		<html lang="en">
			<body className="bg-background text-foreground">
				<main className="min-h-[60vh] container mx-auto px-4 py-8">
					{children}
				</main>
			</body>
		</html>
	);
}
