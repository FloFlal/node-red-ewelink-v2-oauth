# ChangeLog
All notable changes to this project will be documented in this file.

## v0.0.3 (2025-12-22)
### Bug fix
- [Issue 3](https://github.com/FloFlal/node-red-ewelink-v2-oauth/issues/3) - **refresh of the tokens not working**: The expiration date of the tokens where not saved on the client which causes the renewal to never been triggered.
- [Issue 5](https://github.com/FloFlal/node-red-ewelink-v2-oauth/issues/5) - **List Devices**: The list of devices returned only 1 device. Replace the `getAllThings` api call by `getAllThingsAllPages`

## v0.0.2 (2024-01-03)
### Documentation
Add the documentation on the full project

## v0.0.1 (2023-12-08)
Creation of the nodes