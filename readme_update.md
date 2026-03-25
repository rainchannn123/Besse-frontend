25/3/2026 Update Log:

1. Registration/Login
- Remove default placeholder of the input bar to make them clearer

2. MongoDB
- migrate the mongoDB from company DB to our locally built DB (free version)
- Ensure network access for every host, including local host for testing and Azure Service App

3. Azure Service App
- Add frontend and backend code separately onto the Azure Platform with B1 plan
- Add CORS
- Add Envs
- Ensure Nextjs is working

4. Waiting room/role playing
- Fixed the problem that teammate in the same room is not sync with any teammate's action. e.g., comming/exit the room, pressing continue
- Only the group leader (who created the room) can press the "Continue" button for both waiting room, role selection, and team pairing.

5. In-game

5.1 Municipality
- Add the feature that now the cost of transportation fee (from Muni to MRF) is now present
- Ensure there are five available city construction options for player to choose to gain city health

5.2 Broker
- Change the global auction bidding countdown clock updating per second
- Revise the add-on bidding for product to be 5% of the starting price instead of constant $50

5.3 MRF

5.4 All
- Correct the problem that all players with different role falls to the Muni page in default
- Fixed the problem that players are routed to the game over page when the countdown clock reaches zero
- Fixed the problem that budget cannot be negative
- Added a "Surrender" button to allow early game ending upon all three players accepted to surrender

6. Gameover
- Added a "start a new game" button for any situation when player arrived the gameover page
- Fixed the problem that players cannot "start a new game" with error noti stating game is not finished

7. Game master
- Added a game master/admin page which could monitor and control the existing users actions in the game, including viewing the game status, game history record, A BUTTON for terminating users game (force)

Future fix to go:
1. Revise the reward outcome of each construction project
2. Change the logging window style (unclear now)