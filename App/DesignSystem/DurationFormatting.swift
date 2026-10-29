import Foundation

extension TimeInterval {
    /// Seconds in one hour; the point where the clock text gains an hours part.
    private static let secondsPerHour = 3600.0

    /// A clock reading such as "5:03" (minutes and seconds) or "1:05:03" from one hour up.
    ///
    /// Used for the workout timer and for timed sets. Fractions of a second are dropped and
    /// negative values read as zero.
    var clockText: String {
        let whole = Duration.seconds(Int(max(0, self)))
        if self >= Self.secondsPerHour {
            return whole.formatted(.time(pattern: .hourMinuteSecond(padHourToLength: 1)))
        }
        return whole.formatted(.time(pattern: .minuteSecond(padMinuteToLength: 1)))
    }
}
