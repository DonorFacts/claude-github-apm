# Slack Coordinator Context Index

This directory contains context saves for the Slack Coordinator agent.

## Context Save Format

Context saves are named: `YYYYMMDD_HHMMSS_context.md`

## Recent Saves

_No context saves yet_

## Recovery Notes

- `latest.md` always points to the most recent context save
- Context saves include coordination state, active channels, and CC instance status
- For recovery, initialize agent and load latest context