import { Heatmap } from "@repo/ui"

import { LoginForm } from "./LoginForm"
import { loginHeatmapDays } from "./loginHeatmap"

export default function LoginPage() {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a href="#" className="flex items-center gap-2 font-medium">
						{/* <Image src="/logo.svg" alt="Logo" width={32} height={32} /> */}
						Chankay
					</a>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-md">
						<LoginForm />
					</div>
				</div>
			</div>
			<div className="bg-muted relative hidden lg:block">
				<div className="absolute inset-0 flex items-center justify-center p-8 xl:p-10">
					<Heatmap
						days={loginHeatmapDays}
						orientation="vertical"
						showLegend={false}
						className="max-h-full"
					/>
				</div>
			</div>
		</div>
	)
}
