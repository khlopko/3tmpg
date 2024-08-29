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
    var playersLimit: Int { get }
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
    router.add(middleware: LogRequestsMiddleware(.info))
    router.get("/health") { _, _ -> HTTPResponse.Status in
        return .ok
    }

    let apiGroup = router.group("api")

    let state = GameSession.State(playersLimit: arguments.playersLimit, players: [])
    let game = GameSession(state: state)

    let api = API(game: game)
    apiGroup.post("join", use: api.join)
    apiGroup.post("turn", use: api.turn)

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
