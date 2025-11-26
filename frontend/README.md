This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

Droplet-Website uses **Jest** and **React Testing Library** for comprehensive frontend testing.

### Test Structure

```
droplet-website/
├── __tests__/               # Test files
│   ├── auth.test.ts         # Authentication tests
│   ├── dashboard.test.ts    # Dashboard & job management tests
├── jest.config.js           # Jest configuration
└── jest.setup.js            # Test environment setup
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

### Test Categories

#### 1. Authentication Tests (`auth.test.ts`)

- **Login Page Tests**
  - Renders login page without crashing
  - Validates email input field
  - Validates password input field
  - Handles successful login with valid credentials
  - Handles login failure with invalid credentials
  - Redirects to dashboard after successful login
- **Signup Page Tests**
  - Renders signup page without crashing
  - Validates email format
  - Validates password strength requirements
  - Handles successful signup with valid data
  - Handles signup failure with duplicate email
  - Redirects to login after successful signup

#### 2. Dashboard & Job Management Tests (`dashboard.test.ts`)

- **Dashboard Page Tests**
  - Renders dashboard without crashing
  - Displays user information correctly
  - Shows list of training jobs
  - Displays job status correctly (pending, running, completed, failed)
  - Handles job creation navigation
- **Job Creation Form Tests**
  - Renders job creation form
  - Validates model name input
  - Allows selection of training mode (fine-tuning/RAG)
  - Allows selection of data mode (synthetic/custom)
  - Submits job with valid parameters
- **Job Details Page Tests**
  - Renders job details
  - Displays training progress
  - Shows job configuration

### Coverage Goals

- **Target**: 70%+ overall coverage
- **Components**: 80%+ coverage for critical UI components
- **Pages**: 75%+ coverage for all page components

### CI/CD Integration

Tests run automatically on:

- Every push to `main` branch
- Pull request creation/update
- Jenkins pipeline execution (Poll SCM every 5 minutes)

### Test Configuration

The test suite uses:

- **Jest**: Test framework
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **next/jest**: Next.js-specific Jest configuration

See `jest.config.js` for full configuration details.
