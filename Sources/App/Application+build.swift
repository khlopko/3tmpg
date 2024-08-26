import Foundation
import Hummingbird
import Logging

/// Application arguments protocol. We use a protocol so we can call
/// `buildApplication` inside Tests as well as in the App executable.
/// Any variables added here also have to be added to `App` in App.swift and
/// `TestArguments` in AppTest.swift
public protocol AppArguments {
    var hostname: String { get }
    var port: Int { get }
    var logLevel: Logger.Level? { get }
}

public func buildApplication(_ arguments: some AppArguments) async throws
    -> some ApplicationProtocol
{
    let environment = Environment()
    let logger = {
        var logger = Logger(label: "3tmpg")
        logger.logLevel =
            arguments.logLevel ?? environment.get("LOG_LEVEL").map {
                Logger.Level(rawValue: $0) ?? .info
            } ?? .info
        return logger
    }()
    let router = Router()
    // Add logging
    router.add(middleware: LogRequestsMiddleware(.info))
    // Add health endpoint
    router.get("/health") { _, _ -> HTTPResponse.Status in
        return .ok
    }

    let apiGroup = router.group("api")

    let state = GameSession.State(playersLimit: 1000, players: [])
    let game = GameSession(state: state)

    let api = API(game: game)
    apiGroup.post("join", use: api.join)

    let app = Application(
        router: router,
        configuration: .init(
            address: .hostname(arguments.hostname, port: arguments.port),
            serverName: "3tmpg"
        ),
        logger: logger
    )
    return app
}

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
        var nextTeam: Team = .crosses
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
        let player = Player(id: UUID(), team: state.nextTeam)
        state.nextTeam.toggle()
        return player
    }
}

struct Player {
    let id: UUID
    let team: Team
}

enum Team: Int {
    case noughts
    case crosses
}

extension Team {
    mutating func toggle() {
        switch self {
        case .crosses: self = .noughts
        case .noughts: self = .crosses
        }
    }
}

struct API {
    let game: GameSession
}

extension API {
    struct JoinResult: ResponseEncodable {
        let uid: String
        let team: Int
    }

    @Sendable
    func join(
        request: Request,
        context: some RequestContext
    ) async throws -> JoinResult {
        let player = try await game.join()
        let result = JoinResult(uid: player.id.uuidString, team: player.team.rawValue)
        return result
    }
}

