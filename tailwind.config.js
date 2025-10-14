/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './App.tsx',
    './index.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0ea5e9', // sky-500
        'brand-secondary': '#6366f1', // indigo-500
        'gray-900': '#111827',
        'gray-800': '#1f2937',
        'gray-700': '#374151',
        'gray-600': '#4b5563',
        'gray-500': '#6b7280',
        'gray-400': '#9ca3af',
        'gray-300': '#d1d5db',
        'gray-200': '#e5e7eb',
        'gray-100': '#f3f4f6',
      }
    }
  },
  plugins: [],
}
