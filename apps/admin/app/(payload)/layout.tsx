import type {ReactNode} from "react";
import "./global.css";

export default function RootLayout({children}: {children: ReactNode}) {
	return (
		<html lang="en">
			<body className="bg-background text-foreground">
				<main className="min-h-screen min-w-screen">{children}</main>
			</body>
		</html>
	);
}
