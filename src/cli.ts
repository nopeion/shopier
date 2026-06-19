#!/usr/bin/env node
import { formatShopierDiagnostics, runShopierDiagnostics } from './diagnostics';

const command = process.argv[2] ?? 'doctor';

if (command === 'doctor') {
  const result = runShopierDiagnostics();
  console.log(formatShopierDiagnostics(result));
  process.exitCode = result.ok ? 0 : 1;
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Available commands: doctor');
  process.exitCode = 1;
}
