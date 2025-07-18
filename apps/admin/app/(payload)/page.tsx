import React from "react";

export default function AdminComingSoon() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12">
			<div className="bg-white/80 rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-xl w-full">
				{/* SVG Illustration */}
				<svg
					width="80"
					height="80"
					viewBox="0 0 80 80"
					fill="none"
					className="mb-6"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g>
						<ellipse
							cx="40"
							cy="70"
							rx="24"
							ry="6"
							fill="#E0E7FF"
						/>
						<rect
							x="30"
							y="10"
							width="20"
							height="40"
							rx="10"
							fill="#6366F1"
						/>
						<rect
							x="34"
							y="14"
							width="12"
							height="32"
							rx="6"
							fill="#A5B4FC"
						/>
						<rect
							x="38"
							y="46"
							width="4"
							height="10"
							rx="2"
							fill="#6366F1"
						/>
					</g>
				</svg>
				<h1 className="text-4xl font-extrabold mb-2 text-gray-800 drop-shadow">
					Coming Soon
				</h1>
				<p className="text-lg text-gray-600 mb-6 text-center">
					I&apos;m working hard to launch my website. Stay tuned!
				</p>
			</div>
		</div>
	);
}
