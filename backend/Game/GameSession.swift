import Foundation

actor GameSession {
    var state: State

    init(state: State) {
        self.state = state
    }
}

extension GameSession {
    struct State {
        let playersLimit: Int
        var players: [Player]
        var nextPlayer: Team = .crosses
        var nextTurn: Team = .crosses
        var field: [[Team?]] = Array(repeating: Array(repeating: nil, count: 100), count: 100)
    }
}

extension GameSession {
    func canJoin() -> Bool {
        state.players.count < state.playersLimit
    }

    struct WaitForFreeSpotError: Error {
    }

    func join() throws -> Player {
        guard canJoin() else {
            throw WaitForFreeSpotError()
        }
        let player = Player(id: UUID(), team: state.nextPlayer)
        state.players.append(player)
        state.nextPlayer.toggle()
        return player
    }
}

extension GameSession {
    struct InvalidMoveError: Error {
        let pid: UUID
        let move: Move
        let reason: Reason
    }

    func turn(pid: UUID, move: Move) throws {
        guard let playerIndex = state.players.firstIndex(where: { $0.id == pid }) else {
            throw InvalidMoveError(pid: pid, move: move, reason: .noSuchPlayer)
        }
        guard state.players[playerIndex].team == state.nextTurn else {
            throw InvalidMoveError(pid: pid, move: move, reason: .anotherTeamTurn)
        }
        guard move.row < 100 && move.col < 100 else {
            throw InvalidMoveError(pid: pid, move: move, reason: .outOfBounds)
        }
        guard state.field[move.row][move.col] == nil else {
            throw InvalidMoveError(pid: pid, move: move, reason: .alreadyTaken)
        }
        state.field[move.row][move.col] = state.players[playerIndex].team
        state.players[playerIndex].moves.append(move)
        state.nextTurn.toggle()
    }
}

extension GameSession.InvalidMoveError {
    enum Reason {
        case noSuchPlayer
        case anotherTeamTurn
        case outOfBounds
        case alreadyTaken
    }
}

