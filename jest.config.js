module.exports = {
    preset: "ts-jest",
    verbose: true,
    forceExit: true,
    resetModules: false,
    testEnvironment: "node",
    testPathIgnorePatterns: ["./node_modules/", "./tests/", "./build/", "./dist/"],
    moduleFileExtensions: ["js", "json", "ts", "tsx"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testMatch: ["**/*.test.ts", "**/*.test.js"],
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
            diagnostics: {
                warnOnly: true,
            },
        },
    },
    setupFilesAfterEnv: ["./test/setup.ts"],
    coveragePathIgnorePatterns: ["./tests/"],
}
