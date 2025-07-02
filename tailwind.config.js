// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  compilerOptions: {
    // ...existing code...
    types: ["jest", "node"]
  },
  include: [
    "src"
  ]

}
