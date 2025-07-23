# PayviaProject

## Overview

PayviaProject is a full-stack application consisting of a Rust-based smart contract backend and a React Native frontend. The project aims to provide a seamless payment experience leveraging blockchain technology and mobile accessibility.

> **Project Description:** _[Add a brief description of your project's purpose and features here.]_

---

## Directory Structure

```
PayviaProject/
├── payvia/                # Rust backend (smart contracts)
│   ├── Cargo.toml
│   ├── contracts/
│   │   └── payvia/
│   │       ├── Cargo.toml
│   │       ├── Makefile
│   │       └── src/
│   │           ├── lib.rs
│   │           └── test.rs
│   └── README.md
├── Payviafrontend/        # React Native frontend
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── contracts/
│   ├── hooks/
│   ├── screens/
│   ├── services/
│   ├── assets/
│   ├── package.json
│   └── README.md
└── README.md              # (This file)
```

---

## Backend: Rust Smart Contracts

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)

### Setup & Build
```bash
cd payvia/contracts/payvia
cargo build --release
```

### Testing
```bash
cargo test
```

---

## Frontend: React Native App

### Prerequisites
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (if using Expo)
- Android Studio or Xcode (for running on emulators/simulators)

### Setup
```bash
cd Payviafrontend
npm install
# or
yarn install
```

### Running the App
- **Start Metro Bundler:**
  ```bash
  npx expo start
  ```
- **Run on Android:**
  ```bash
  npx expo run:android
  ```
- **Run on iOS:**
  ```bash
  npx expo run:ios
  ```

---

## Usage
- Deploy the backend smart contracts as required (see backend README for details).
- Start the frontend app and connect it to the backend as configured.

---

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

> _[Specify your license here, e.g., MIT, Apache 2.0, etc.]_

---

## Contact

> _[Add your contact information or project links here.]_ 