import Foundation

struct Player {
    let id: UUID
    let team: Team
    var moves: [Move] = []
}

struct Move {
    let row: Int
    let col: Int
}

extension Move: Sendable {
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

