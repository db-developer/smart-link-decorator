[ROADMAP](../ROADMAP.md) [CHANGELOG](../CHANGELOG.md) [LICENSE](../LICENSE) [README](../README.md)

### Additional validation and error handling for link type configuration

- **Validation**: Ensure that all link type settings are correctly entered, for example:
  - ✔ ~~Prefix is a single character only.~~ (done, v.0.1.0)
  - Link type identifier is not empty and contains no invalid characters.
  - ✔ ~~Font and background colors are valid CSS values.~~ (done using color picker, v.0.1.0)

- **Error Handling**: Provide clear feedback when a configuration is invalid, for example:
  - Tooltip or inline message like "Prefix must be a single character".
  - Highlight fields with incorrect values visually.
  - Prevent invalid configurations from being applied, avoiding potential plugin errors.

- **Goal**: Improve user guidance and maintain plugin stability by ensuring link types are consistently configured.
  - Ensure, a prefix cannot be assigned to more than one link type.
