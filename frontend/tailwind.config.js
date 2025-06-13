/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Quét tất cả file JS/JSX trong src
  ],
  theme: {
    extend: {
      width: {
        '15': '60px', // Định nghĩa w-15 là 60px (đáp ứng kích thước mong muốn của bạn)
        '16': '64px', // Giữ w-16 mặc định nhưng có thể tùy chỉnh
      },
      height: {
        '15': '60px', // Định nghĩa h-15 là 60px
        '16': '64px', // Giữ h-16 mặc định
      },
      maxWidth: {
        '5xl': '64rem', // Định nghĩa max-w-5xl
      },
    },
  },
  plugins: [],
};