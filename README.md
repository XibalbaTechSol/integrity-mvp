# Integrity Protocol MVP 🧪

Research sandbox and initial proof-of-concept for the **Integrity Protocol**.

This project serves as the experimental ground for validating the Tri-Metric protocol, testing early ZK-ML circuits, and prototyping the Behavioral Commitment Chain (BCC) integration.

## Objectives

- **Protocol Validation**: Early empirical testing of the Entropy, Grounding, and Sacrifice scoring logic.
- **Inference Hub Prototyping**: Researching LLM provider stability and ranking heuristics.
- **ZK Circuit Development**: Prototyping Aztec Noir circuits for reputation range proofs and private attestation.
- **BCC State Snapshots**: Testing high-frequency intent declaration and verification loops.

## Historical Context
The code in this repository transitioned the protocol from conceptual PDEs and control theory models into the functional Rust/Solidity architecture used in the production Oracle.

## Project Structure

```
integrity-mvp/
├── circuits/           # Early Aztec Noir prototypes
├── research/           # Jupyter notebooks and math proofs
├── tests/              # End-to-end protocol validation tests
├── docs/               # Research papers and design notes
└── README.md           # This file
```

## Documentation
See the [MVP Research Log](docs/RESEARCH_LOG.md) for detailed findings.
