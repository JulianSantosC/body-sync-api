// Global Jest mock for the `uuid` package, wired up via "moduleNameMapper"
// in package.json's Jest config ("^uuid$" -> this file). Applies to every
// test in the project automatically.
//
// Why this exists: uuid's Node entry point ships as pure ESM, it means that uses
// the structure ("export {...}" syntax instead of `module.exports`), which Jest's
// default CommonJS test runtime cannot execute that syntax directly, so the
// "Unexpected token 'export'" error is thrown.
// uuid (the version you have) publishes its Node entry point as pure ESM
// (`export { ... }` instead of `module.exports`). By default, Jest runs in
// a CommonJS environment and 
//
//Create a mock function named v7 (which simulates the actual UUID v7 algorithm) that,
// instead of performing complex, random mathematical calculations to generate a
// unique ID, this function always returns exactly the same
// text: '00000000-0000-7000-0000-000000000000'. This only serves as a placeholder
// for testing purposes, ensuring that any code relying on UUID generation can
// function without needing to deal with the complexities of actual UUID generation, in this wah,
// avoid the error asociated to the ESM.
export const v7 = (): string => '00000000-0000-7000-0000-000000000000';