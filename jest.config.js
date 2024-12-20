/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest', // Tells Jest to use ts-jest for TypeScript
  testEnvironment: 'node', // Use 'jsdom' if you're testing frontend code
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Handle .ts and .tsx files using ts-jest
  },
  testMatch: ['**/?(*.)+(spec|test).ts'], // Match files that end in .test.ts or .spec.ts
  moduleFileExtensions: ['ts', 'tsx', 'js'], // Recognize these file extensions
};