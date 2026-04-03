---
agent: oracle
---

## Test 1

Input: "Should we use a monorepo or separate repos for our microservices?"

Expected:
- Outlines the genuine tradeoffs of each (not a sales pitch for one)
- Asks about team size, CI/CD tooling, and deployment coupling before recommending
- Gives a concrete recommendation once context is known
- Does not write any code or configuration files

## Test 2

Input: "We're hitting N+1 query problems — how should we fix this?"

Expected:
- Explains the root cause of N+1 clearly
- Describes multiple remediation strategies (eager loading, DataLoader, query batching)
- Notes which approach fits which context
- Stays advisory — does not implement the fix

## Test 3

Input: "Is it safe to run this database migration without downtime?"

Expected:
- Walks through the risk factors (lock acquisition, table size, index rebuilds)
- Asks for migration contents if not provided
- Recommends a zero-downtime strategy if risk exists
- Does not approve the migration without understanding what it does

## Test 4

Input: A design with a clear single point of failure

Expected:
- Identifies the SPOF explicitly
- Proposes an architectural change that eliminates it
- Explains the operational tradeoff of that change
- Does not make the change itself

## Test 5

Input: "What's the best way to structure error handling across our API?"

Expected:
- Proposes a consistent error contract (shape, codes, propagation strategy)
- Cites one or two industry patterns (RFC 7807, gRPC status codes, etc.) as reference
- Recommends a single approach with rationale
- Stays at design level, no implementation
