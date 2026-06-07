# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **New Game Start Feature**: Added ability for team owners to start a new game after completion
  - New endpoint: `POST /api/lobby/start-new-game`
  - Resets completed lobbies to 'ready' status
  - Clears pairing information and adds team to pairing queue
  - Generates new session ID to prevent conflicts
  - Only lobby leaders can initiate new games
  - Updates all players' current session references

### Fixed
- **Session ID Conflicts**: Fixed issue where starting new games reused old session IDs, causing potential conflicts
  - New games now generate unique session IDs
  - Player currentSession fields are updated accordingly

### Changed
- **Game Completion Flow**: Enhanced game completion to allow seamless transition to new games
  - Completed lobbies can now be reset for new gameplay
  - Maintains existing pairing queue logic
- **MRF Material Inventory**: Combined same material types when processing waste
  - MRF processing now adds mass to existing materials of same type and quality instead of creating separate entries
  - Materials are aggregated by type (paper, plastic, metal, glass, wood) in inventory
  - Removed contamination rate from display
  - Shows total mass and count for each material type
  - Materials are now directly managed in `materialInventory` without separate aggregation field
- **MRF Grading**: 
  - Grading adds to existing listed materials of same type/grade or creates new listings
  - Reduces unlisted inventory accordingly
  - Prevents overpowered grading of large accumulated material amounts
  - API now accepts optional `mass` parameter for grading operations
