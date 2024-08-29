import Foundation
import Hummingbird
import HummingbirdTesting
import Logging
import Testing

@testable import App

@Suite
struct AppTests {
    struct TestArguments: AppArguments {
        let hostname = "127.0.0.1"
        let port = 0
        let logLevel: Logger.Level? = .trace
        let playersLimit: Int
    }

    @Test
    func health() async throws {
        let app = try await makeApp()
        try await app.test(.router) { client in
            try await client.execute(uri: "/health", method: .get) { response in
                #expect(response.status == .ok)
            }
        }
    }

    @Test
    func join() async throws {
        let app = try await makeApp()
        try await app.test(.router) { client in
            try await client.execute(uri: "/api/join", method: .post) { response in
                #expect(response.status == .ok)
                let body = try JSONDecoder().decode(API.JoinResult.self, from: response.body)
                #expect(body.team == 1)
                #expect(!body.uid.isEmpty)
            }
        }
    }

    @Test
    func join_tooManyPeople() async throws {
        let app = try await makeApp(playersLimit: 0)
        try await app.test(.router) { client in
            try await client.execute(uri: "/api/join", method: .post) { response in
                #expect(response.status == .forbidden)
            }
        }
    }

    private func makeApp(playersLimit: Int = 10) async throws -> some ApplicationProtocol {
        let args = TestArguments(playersLimit: playersLimit)
        let app = try await buildApplication(args)
        return app
    }
}
