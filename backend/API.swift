import Foundation
import Hummingbird

struct API {
    let game: GameSession
}

extension API {
    struct JoinResult: ResponseEncodable, Decodable {
        let uid: String
        let team: Int
    }

    @Sendable
    func join(
        request: Request,
        context: some RequestContext
    ) async throws -> JoinResult {
        do {
            let player = try await game.join()
            let result = JoinResult(uid: player.id.uuidString, team: player.team.rawValue)
            return result
        } catch is GameSession.WaitForFreeSpotError {
            throw HTTPError(.forbidden, message: "Too much players. Try again later.")
        }
    }
}

extension API {
    struct TurnRequest: Decodable {
        let pid: UUID
        let row: Int
        let col: Int
    }

    @Sendable
    func turn(request: Request, context: some RequestContext) async throws -> HTTPResponse.Status {
        do {
            let body = try await request.decode(as: TurnRequest.self, context: context)
            print(body)
            try await game.turn(pid: body.pid, move: Move(row: body.row, col: body.col))
            return .ok
        } catch let error as GameSession.InvalidMoveError {
            let (status, message): (HTTPResponse.Status, String) = switch error.reason {
                case .noSuchPlayer: (.notFound, "Player with this pid doesn't exist in game.")
                case .anotherTeamTurn: (.badRequest, "Another team's turn. Please, wait.")
                case .outOfBounds: (.badRequest, "No such square on the board.")
                case .alreadyTaken: (.badRequest, "This square has already been taken.")
            }
            throw HTTPError(status, message: message)
        }
    }
}
