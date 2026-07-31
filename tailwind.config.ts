import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				truco: {
					'green': '#186634',
					'stick': '#FDB833',
					'head': '#F44336',
					'sheet': '#0C1F14',     // fondo del panel del VAR: verde de tiza
					'cream': '#F5EFE1',     // tinta del panel
					'headSoft': '#FF8A80',  // rojo legible como texto chico sobre el panel
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'match-appear': {
					'0%': { opacity: '0', transform: 'scale(0.8)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'match-fade': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'match-manual': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'match-disappear': {
					'0%': { opacity: '1', transform: 'scale(1)' },
					'100%': { opacity: '0', transform: 'scale(0.8)' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-in': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'pulse-gentle': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(253, 184, 51, 0.4)' },
					'50%': { boxShadow: '0 0 15px rgba(253, 184, 51, 0.8)' }
				},
				'rule-draw': {
					'0%': { transform: 'scaleX(0)', opacity: '0' },
					'100%': { transform: 'scaleX(1)', opacity: '1' }
				},
				'rule-draw-y': {
					'0%': { transform: 'scaleY(0)', opacity: '0' },
					'100%': { transform: 'scaleY(1)', opacity: '1' }
				},
				'band-wipe': {
					'0%': { transform: 'scaleX(0)' },
					'100%': { transform: 'scaleX(1)' }
				},
				'band-shine': {
					'0%': { transform: 'translateX(-140%)', opacity: '0' },
					'12%': { opacity: '1' },
					'100%': { transform: 'translateX(300%)', opacity: '0' }
				},
				'stage-pop': {
					'0%, 100%': { transform: 'scale(1)' },
					'35%': { transform: 'scale(1.06)' }
				},
				'fab-in': {
					'0%': { opacity: '0', transform: 'scale(0.7) translateY(6px)' },
					'100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
				},
				'var-row-in': {
					'0%': { opacity: '0', transform: 'translateY(9px)' },
					'100%': { opacity: '1', transform: 'none' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'match-appear': 'match-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'match-fade': 'match-fade 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'match-manual': 'match-manual 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'match-disappear': 'match-disappear 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'rule-draw': 'rule-draw 0.52s cubic-bezier(0.22, 1, 0.36, 1) both',
				'rule-draw-y': 'rule-draw-y 0.52s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both',
				'band-wipe': 'band-wipe 0.42s cubic-bezier(0.65, 0, 0.35, 1) forwards',
				'band-shine': 'band-shine 0.9s ease-out 0.12s 1 forwards',
				'stage-pop': 'stage-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'fab-in': 'fab-in 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) both',
				'var-row-in': 'var-row-in 0.24s cubic-bezier(0.4, 0, 0.2, 1) both'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
