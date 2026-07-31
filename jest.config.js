/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: [
        '**/*.test.ts',
        '**/*.property.test.ts'
    ],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    // Thresholds are a ratchet, not an aspiration: they sit just under the
    // current numbers so `npm test` fails on any regression. Raise them as
    // coverage improves; never lower them to make a red run pass.
    //
    // Note: Jest removes path-specific files from the `global` group, so these
    // global numbers describe everything *except* src/api.ts. They read lower
    // than the printed "All files" row for that reason.
    coverageThreshold: {
        global: {
            branches: 58,
            functions: 73,
            lines: 73,
            statements: 72
        },
        './src/api/client.ts': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    verbose: true,
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    }
};
